"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, MessageSquare, Search, Users, Workflow, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "message" | "contact" | "flow" | "page";
  url: string;
  icon: React.ReactNode;
  metadata?: string;
}

interface UniversalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const UniversalSearch = ({ isOpen, onClose }: UniversalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock data para demonstração
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Fluxo de Boas-vindas",
      subtitle: "Fluxo principal para novos usuários",
      type: "flow",
      url: "/flows/1",
      icon: <Workflow className="h-4 w-4 text-blue-500" />,
      metadata: "Ativo • 45 execuções hoje",
    },
    {
      id: "2",
      title: "João Silva",
      subtitle: "+55 11 98765-4321",
      type: "contact",
      url: "/contacts/2",
      icon: <Users className="h-4 w-4 text-green-500" />,
      metadata: "Online • Última mensagem há 2h",
    },
    {
      id: "3",
      title: "Mensagem de suporte técnico",
      subtitle: "Preciso de ajuda com...",
      type: "message",
      url: "/messages/3",
      icon: <MessageSquare className="h-4 w-4 text-purple-500" />,
      metadata: "Hoje às 14:30",
    },
  ];

  // Foco automático quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Busca simulada
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    // Adicionar às buscas recentes
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
      localStorage.setItem("recent-searches", JSON.stringify(updated));
      return updated;
    });

    router.push(result.url);
    onClose();
    setQuery("");
  };

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-start justify-center p-4 pt-16">
            <motion.div
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
                layout: { duration: 0.3 },
              }}
            >
              {/* Header com input */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 relative">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar mensagens, contatos, fluxos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 py-4 bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
                />

                <div className="flex items-center space-x-2">
                  {query && (
                    <button
                      onClick={clearQuery}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Limpar busca"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}

                  {/* Botão de fechar modal */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Fechar busca (Esc)"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Resultados */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <motion.div
                    className="p-8 text-center text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.p
                      className="text-sm font-medium"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      Buscando...
                    </motion.p>
                  </motion.div>
                ) : results.length > 0 ? (
                  <motion.div
                    className="p-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {results.map((result, index) => (
                      <motion.button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          index === selectedIndex
                            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.01,
                          transition: { duration: 0.1 },
                        }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">{result.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.metadata && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {result.metadata}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : query.trim() ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum resultado encontrado para "{query}"</p>
                  </div>
                ) : (
                  <div className="p-4">
                    {recentSearches.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Buscas recentes
                        </h3>
                        <div className="space-y-1">
                          {recentSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => setQuery(search)}
                              className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Atalhos
                      </h3>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>
                          <kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            ↑↓
                          </kbd>{" "}
                          para navegar
                        </p>
                        <p>
                          <kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            Enter
                          </kbd>{" "}
                          para selecionar
                        </p>
                        <p>
                          <kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            Esc
                          </kbd>{" "}
                          para fechar
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UniversalSearch;
