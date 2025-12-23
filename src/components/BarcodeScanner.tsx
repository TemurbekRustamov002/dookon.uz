/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Smartphone, Camera, Keyboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io, Socket } from 'socket.io-client';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const isDev = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL || (isDev ? `http://${window.location.hostname}:4000` : "https://api.dookon.uz");

export default function BarcodeScanner({ onBarcodeDetected, isOpen, onClose }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'remote'>('camera');
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // HID Scanner (Physical Device) Support
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input field
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const now = Date.now();
      // If time between keys is > 100ms, assume it's manual typing not a scanner
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          onBarcodeDetected(buffer);
          onClose();
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Remote Scanner (Socket) Support
  useEffect(() => {
    if (!isOpen) return;

    // Connect socket if not connected
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        withCredentials: true,
        autoConnect: true
      });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('join_scanner_session', sessionId);
      });

      socketRef.current.on('barcode_scanned', (code: string) => {
        onBarcodeDetected(code);
        onClose();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, sessionId]);

  // Camera Scanner Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          try {
            const scanner = new Html5QrcodeScanner(
              "reader",
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
              },
              false
            );

            scanner.render(
              (decodedText) => {
                onBarcodeDetected(decodedText);
                handleClose(scanner);
              },
              (_errorMessage) => {
                // Ignore parsing errors
              }
            );
            scannerRef.current = scanner;
          } catch (e) {
            console.error("Scanner init failed", e);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) { }
        scannerRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  const handleClose = async (scannerInstance = scannerRef.current) => {
    if (scannerInstance) {
      try {
        await scannerInstance.clear();
      } catch (e) {
        console.error("Failed to clear scanner", e);
      }
      scannerRef.current = null;
    }
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeDetected(manualInput.trim());
      handleClose();
    }
  };

  // if (!isOpen) return null; // Component stays mounted to keep socket connection alive!

  const remoteUrl = `${window.location.origin}/remote-scan?session=${sessionId}`;

  return (
    <div className={`fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 ${!isOpen ? 'hidden' : ''}`}>
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Keyboard size={20} className="text-gray-400" />
            Skaner
          </h3>
          <button onClick={() => onClose()} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'camera' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Camera size={18} />
            Kamera
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'remote' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Smartphone size={18} />
            Telefon
          </button>
        </div>

        <div className="p-4 overflow-y-auto">

          {activeTab === 'camera' ? (
            <div id="reader" className="overflow-hidden rounded-lg mb-4 bg-gray-100 min-h-[300px]"></div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 min-h-[300px]">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-indigo-100 mb-4">
                <QRCodeSVG value={remoteUrl} size={200} />
              </div>
              <p className="text-center font-bold text-gray-800 mb-2">Telefoningiz orqali skanerlang</p>
              <p className="text-center text-sm text-gray-500 max-w-xs mb-4">
                Kamerani ochib yuqoridagi QR kodni skanerlang va telefoningizni qo'shimcha skaner sifatida ishlating.
              </p>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-center">
                Sessiya ID: <span className="font-mono font-bold text-indigo-600">{sessionId}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Barkod raqami..."
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            />
            <button
              onClick={handleManualSubmit}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
            >
              OK
            </button>
          </div>

          <div className="mt-4 text-center">
            {activeTab === 'camera' && (
              <p className="text-xs text-gray-400">USB Skanerlar avtomatik ishlaydi</p>
            )}
            {activeTab === 'remote' && (
              <p className="text-xs text-gray-400">Diqqat: Ushbu oynani yopsangiz ham telefon orqali skanerlash ishlashda davom etadi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
