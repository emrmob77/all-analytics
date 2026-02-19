"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface SupportTicket {
  id: string;
  subject: string;
  category: "technical" | "billing" | "integration" | "general";
  priority: "low" | "medium" | "high";
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

function SupportModule() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTickets() {
    setIsLoading(true);

    try {
      const data = await requestApi<{ tickets: SupportTicket[] }>("/api/v1/support/tickets");
      setTickets(data.tickets);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load support tickets.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ ticket: SupportTicket }>("/api/v1/support/tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          subject: formData.get("subject"),
          category: formData.get("category"),
          priority: formData.get("priority"),
          description: formData.get("description")
        })
      });

      setTickets((current) => [data.ticket, ...current]);
      toast.success("Support ticket created.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create ticket.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Support Center</h2>
        <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
          Open a support ticket and track status changes from one place.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitTicket}>
          <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" name="subject" placeholder="Ticket subject" required />

          <select className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue="technical" name="category">
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="integration">Integration</option>
            <option value="general">General</option>
          </select>

          <select className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" defaultValue="medium" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <textarea className="min-h-28 rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" name="description" placeholder="Describe the issue" required />

          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            Submit Ticket
          </button>
        </form>

        <p className="mt-4 text-sm text-text-muted-light dark:text-text-muted-dark">
          Need docs first? <Link className="font-medium text-primary hover:underline" href="/knowledge-base">Open Knowledge Base</Link>
        </p>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Ticket Status</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">Loading tickets...</p>
        ) : (
          <div className="mt-3 space-y-3">
            {tickets.map((ticket) => (
              <article className="rounded-lg border border-border-light p-4 dark:border-border-dark" key={ticket.id}>
                <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{ticket.subject}</p>
                <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                  {ticket.category} · {ticket.priority} · {ticket.status} · {new Date(ticket.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">{ticket.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SupportModule;
