"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { animated, config, useSpring } from "react-spring";
import { useDrag, useWheel } from "react-use-gesture";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName?: string;
  fileSize?: string;
}

export default function ImageViewer({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  fileSize,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState([0, 0]);

  // Animação de entrada/saída do modal
  const modalAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "scale(1)" : "scale(0.95)",
    config: config.gentle,
  });

  // Animação do backdrop
  const backdropAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    config: config.gentle,
  });

  // Atalhos de teclado
  useHotkeys("esc", () => onClose(), [onClose]);
  useHotkeys("space", () => onClose(), [onClose]);
  useHotkeys("enter", () => handleDownload(), [imageUrl, fileName]);
  useHotkeys("plus", () => setScale((s) => Math.min(s + 0.2, 3)), []);
  useHotkeys("minus", () => setScale((s) => Math.max(s - 0.2, 0.5)), []);
  useHotkeys(
    "0",
    () => {
      setScale(1);
      setPosition([0, 0]);
    },
    []
  );

  // Gestos de toque e mouse
  const gestureBinds = useDrag(
    ({ movement: [mx, my], memo = position }) => {
      setPosition([memo[0] + mx, memo[1] + my]);
      return memo;
    },
    { filterTaps: true }
  );

  const wheelBinds = useWheel(
    ({ event, delta: [, dy] }) => {
      event.preventDefault();
      setScale((s) => Math.max(0.5, Math.min(3, s - dy * 0.001)));
    },
    { eventOptions: { passive: false } }
  );

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition([0, 0]);
    }
  }, [isOpen]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || "imagem";
    link.click();
  };

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition([0, 0]);
    }
  };

  if (!isOpen) return null;

  const images = [
    {
      original: imageUrl,
      thumbnail: imageUrl,
      description: fileName || "Imagem",
    },
  ];

  return (
    <animated.div
      style={backdropAnimation}
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
    >
      <animated.div
        style={modalAnimation}
        className="relative max-w-4xl max-h-4xl w-full h-full p-4"
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
          title="Fechar (ESC)"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header com informações */}
        {(fileName || fileSize) && (
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white rounded px-3 py-2">
            {fileName && <p className="text-sm font-medium">{fileName}</p>}
            {fileSize && <p className="text-xs text-gray-300">{fileSize}</p>}
          </div>
        )}

        {/* Controles de zoom */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
            title="Diminuir zoom (-)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <span className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
            title="Aumentar zoom (+)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              setScale(1);
              setPosition([0, 0]);
            }}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded px-3 py-2 text-sm transition-all duration-200 hover:scale-110"
            title="Reset zoom (0)"
          >
            Reset
          </button>
        </div>

        {/* Galeria de imagens com gestos */}
        <div
          className="h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          {...gestureBinds()}
          {...wheelBinds()}
          onDoubleClick={handleDoubleClick}
        >
          <div
            style={{
              transform: `scale(${scale}) translate(${position[0]}px, ${position[1]}px)`,
              transition: scale === 1 ? "transform 0.3s ease" : "none",
            }}
          >
            <ImageGallery
              items={images}
              showThumbnails={false}
              showPlayButton={false}
              showBullets={false}
              showNav={false}
              showFullscreenButton={true}
              useBrowserFullscreen={true}
              onErrorImageURL="/placeholder-image-error.png"
            />
          </div>
        </div>

        {/* Botão de download */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-all duration-200 shadow-lg hover:scale-110"
            title="Baixar imagem (Enter)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>

        {/* Instruções de uso */}
        <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white rounded px-3 py-2">
          <p className="text-xs text-gray-300">
            ESC/Space: Fechar • +/-: Zoom • 0: Reset • Enter: Download • Duplo
            clique: Zoom • Scroll: Zoom • Arraste: Mover
          </p>
        </div>
      </animated.div>

      {/* Clique para fechar (área de fundo) */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </animated.div>
  );
}
