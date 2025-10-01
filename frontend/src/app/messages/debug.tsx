"use client";

import TicketList from "@/app/messages/components/tickets/TicketList";
import { useTickets } from "@/store/tickets";
import { TicketIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function TicketsPageDebug() {
  const { tickets, loading, loadTickets } = useTickets();

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSelectTicket = (ticket: any) => {
    console.log("Ticket selecionado:", ticket);
  };

  const handleReopenTicket = (ticketId: string) => {
    console.log("Reabrir ticket:", ticketId);
  };

  const handleCloseTicket = (ticketId: string) => {
    console.log("Fechar ticket:", ticketId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Simples */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <TicketIcon className="w-7 h-7 mr-3 text-blue-600" />
          Tickets Debug
        </h1>
      </div>

      {/* Content Simples */}
      <div className="flex-1 flex">
        {/* Lista de Tickets */}
        <TicketList
          tickets={tickets}
          selectedTicketId={null}
          loading={loading}
          onSelectTicket={handleSelectTicket}
          onReopenTicket={handleReopenTicket}
          onCloseTicket={handleCloseTicket}
        />

        {/* Área à direita */}
        <div className="flex-1 bg-white p-4">
          <p>Total de tickets: {tickets.length}</p>
          <p>Loading: {loading ? "Sim" : "Não"}</p>
        </div>
      </div>
    </div>
  );
}
