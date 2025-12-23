/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { io } from 'socket.io-client';
import { Loader2, CheckCircle2, AlertCircle, Scan } from 'lucide-react';

const isDev = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL || (isDev ? `http://${window.location.hostname}:4000` : "https://api.dookon.uz");

const socket = io(API_URL, {
    withCredentials: true,
    autoConnect: false
});

export default function RemoteScanner() {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'scanned' | 'error'>('connecting');
    const [scannedCode, setScannedCode] = useState<string>('');
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const session = params.get('session');

        if (!session) {
            setStatus('error');
            return;
        }
        setSessionId(session);

        socket.connect();

        const onConnect = () => {
            setStatus('connected');
            socket.emit('join_scanner_session', session);
        };

        socket.on('connect', onConnect);

        // If already connected manually or reconnected:
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (status === 'connected' || status === 'scanned') {
            // Init scanner
            // Wait for DOM
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "remote-reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true
                    },
                    false
                );

                scanner.render((decodedText) => {
                    socket.emit('remote_scan', { sessionId, barcode: decodedText });
                    setScannedCode(decodedText);
                    setStatus('scanned');
                    // Don't clear scanner, keep scanning
                    setTimeout(() => setStatus('connected'), 1000);
                }, (_error) => {
                    // console.warn(error);
                });
            }, 100);

            return () => {
                clearTimeout(timer);
                // We can't easily clear the scanner instance without a ref, 
                // but reloading the page is common for "stop".
                // For React, we should ideally use clearing.
                try {
                    //  scanner.clear(); // Hard to access instance here due to closure
                    // Html5QrcodeScanner doesn't return an instance, it IS the class.
                    // We should store it in a ref if we want to clear.
                } catch (e) { }
            };
        }
    }, [status === 'connecting']); // Only run once when transition from connecting -> connected

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            {status === 'error' && (
                <div className="text-center p-6 bg-red-900/50 rounded-xl border border-red-500/50">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <h1 className="text-xl font-bold mb-2">Xatolik</h1>
                    <p>Sessiya ID topilmadi. QR kodni qaytadan skanerlang.</p>
                </div>
            )}

            {status === 'connecting' && (
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 animate-spin text-indigo-500" size={48} />
                    <p>Ulanmoqda...</p>
                </div>
            )}

            {(status === 'connected' || status === 'scanned') && (
                <div className="w-full max-w-md flex flex-col items-center">
                    <div className="mb-6 text-center">
                        <Scan className="mx-auto mb-2 text-indigo-400" size={32} />
                        <h1 className="text-xl font-bold">Masofaviy Skaner</h1>
                        <p className="text-gray-400 text-sm">Kamera orqali barkodni skanerlang</p>
                    </div>

                    <div
                        id="remote-reader"
                        className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700 mb-6"
                    />

                    {status === 'scanned' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full bg-green-500/20 border border-green-500/50 p-4 rounded-xl flex items-center justify-center gap-3">
                            <CheckCircle2 className="text-green-500" size={24} />
                            <span className="font-mono text-lg font-bold">{scannedCode}</span>
                        </div>
                    )}

                    <p className="fixed bottom-4 text-xs text-gray-500">Dookon.uz Remote Scanner</p>
                </div>
            )}
        </div>
    );
}
