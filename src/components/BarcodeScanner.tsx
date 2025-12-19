import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Copy, Check } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function BarcodeScanner({ onBarcodeDetected, isOpen, onClose }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure DOM is ready
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
              /* verbose= */ false
            );

            scanner.render(
              (decodedText) => {
                onBarcodeDetected(decodedText);
                handleClose(scanner);
              },
              (errorMessage) => {
                // Parse error, ignore mainly
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

    // Cleanup handled in handleClose usually, but purely unconmount:
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">Skaner</h3>
          <button onClick={() => handleClose()} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {/* Scanner Container */}
          <div id="reader" className="overflow-hidden rounded-lg mb-4 bg-gray-100 min-h-[300px]"></div>

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
            <p className="text-xs text-gray-400">Kamera orqali mahsulot barkodini skanerlang</p>
          </div>
        </div>
      </div>
    </div>
  );
}
