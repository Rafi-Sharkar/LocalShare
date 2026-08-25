'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Wifi,
  ExternalLink,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface InterfaceOption {
  name: string;
  address: string;
  url: string;
  isRecommended?: boolean;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaces: InterfaceOption[];
  primaryUrl: string;
  port: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  interfaces,
  primaryUrl,
  port,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(primaryUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (primaryUrl) {
      setSelectedUrl(primaryUrl);
    }
  }, [primaryUrl]);

  useEffect(() => {
    if (!isOpen || !selectedUrl) return;

    QRCode.toDataURL(selectedUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [isOpen, selectedUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-slate-100 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-3">
            <Smartphone className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Connect Any Device on Wi-Fi
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Scan this QR code with your phone camera or enter the URL on any laptop / tablet on the same Wi-Fi.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-4 bg-white rounded-2xl shadow-xl shadow-teal-500/10 border-4 border-teal-500/20 flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Wi-Fi Connection QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-sm">
                Generating QR...
              </div>
            )}
          </div>

          {/* URL Display & Copy Button */}
          <div className="w-full mt-6 flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={selectedUrl}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm font-mono text-teal-300 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Network Interface Switcher (If multiple exist) */}
        {interfaces.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Select Network Adapter:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {interfaces.map((net) => (
                <button
                  key={net.address}
                  onClick={() => setSelectedUrl(net.url)}
                  className={`text-left p-2.5 rounded-lg text-xs border transition-all ${
                    selectedUrl === net.url
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300 font-semibold'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{net.name}</span>
                    {net.isRecommended && (
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
                        Wi-Fi
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {net.address}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Instructions */}
        <div className="mt-5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" />
          <div>
            <p className="font-medium text-indigo-200">Zero Internet Required</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Transfers happen directly over your local Wi-Fi at maximum router speeds without passing through any external servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
