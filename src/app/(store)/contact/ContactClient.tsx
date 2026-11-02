"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { MessageCircle, Mail, MapPin, Phone, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/lib/store/toastStore";

export default function ContactClient({
  info,
}: {
  info: {
    contactEmail: string;
    contactPhone: string;
    address: string;
    socialLinks: { whatsapp?: string };
  };
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const whatsappDigits = (info.socialLinks.whatsapp || info.contactPhone).replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Your message could not be sent.");
      setSubmitted(true);
      toast.success("Message sent", result.message);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Your message could not be sent. Please try again.";
      setError(message);
      toast.error("Message not sent", message);
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full bg-white border border-line rounded-[10px] px-4 py-3 text-[15px] text-ink placeholder-ink-faint focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10";

  return (
    <>
      <PageHeader crumb="Contact Us" title="How can we help?" intro="Ask about a product, a delivery, or an existing order. Your message goes directly to our support team." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-start">
          <div className="lg:col-span-5 bg-white border border-line-soft rounded-2xl p-6 sm:p-7 paper-card">
            <h2 className="font-display text-xl text-ink pb-3 border-b border-line-soft">
              Reach us directly
            </h2>

            <div className="space-y-3 mt-5 text-[15px]">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-xl bg-gold-50 border border-gold-200 hover:border-navy-700/50 transition"
                >
                  <MessageCircle className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-ink block">WhatsApp desk</span>
                    <span className="text-sm text-ink-faint">{info.contactPhone || info.socialLinks.whatsapp} · message us directly</span>
                  </span>
                </a>
              )}

              {info.contactPhone && (
                <a href={`tel:${info.contactPhone.replace(/\s/g, "")}`} className="flex items-start gap-4 p-4 rounded-xl border border-line-soft hover:border-line transition">
                  <Phone className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-ink block">Phone</span><span className="text-sm text-ink-faint">{info.contactPhone}</span></span>
                </a>
              )}
              {info.contactEmail && (
                <a href={`mailto:${info.contactEmail}`} className="flex items-start gap-4 p-4 rounded-xl border border-line-soft hover:border-line transition">
                  <Mail className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-ink block">Email</span><span className="text-sm text-ink-faint break-all">{info.contactEmail}</span></span>
                </a>
              )}
              {info.address && (
                <div className="flex items-start gap-4 p-4 rounded-xl border border-line-soft">
                  <MapPin className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
                  <span><span className="font-medium text-ink block">Address</span><span className="text-sm text-ink-faint">{info.address}</span></span>
                </div>
              )}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-line-soft">
                <Clock className="h-5 w-5 text-navy-700 shrink-0 mt-0.5" />
                <span><span className="font-medium text-ink block">Hours</span><span className="text-sm text-ink-faint">Support desk: 10am – 9pm, every day</span></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-line-soft rounded-2xl p-6 sm:p-8 paper-card">
              <h2 className="font-display text-xl text-ink">Send a message</h2>

              {submitted ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-11 w-11 text-navy-700 mx-auto" aria-hidden="true" />
                  <h3 className="font-display text-2xl text-ink mt-4">Thank you</h3>
                  <p className="text-[15px] text-ink-faint max-w-sm mx-auto mt-2">
                    Your note is with our support desk. We will get back to you shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setError(""); }}
                    className="btn-line mt-5 px-6 py-2.5 rounded-[10px] text-sm font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-6" noValidate>
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="ct-name" className="text-sm font-medium text-ink">Your name</label>
                      <input id="ct-name" type="text" maxLength={120} required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bilal Ahmed" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="ct-phone" className="text-sm font-medium text-ink">Phone number</label>
                      <input id="ct-phone" type="tel" maxLength={40} required autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0300 1234567" className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ct-email" className="text-sm font-medium text-ink">Email</label>
                    <input id="ct-email" type="email" maxLength={254} required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="bilal@example.com" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ct-subject" className="text-sm font-medium text-ink">Subject</label>
                    <input id="ct-subject" type="text" maxLength={160} required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Product question or order help" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ct-msg" className="text-sm font-medium text-ink">Your message</label>
                    <textarea id="ct-msg" maxLength={4000} required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help…" className={`${inputCls} leading-relaxed`} />
                  </div>
                  <button type="submit" disabled={sending} className="btn-ink w-full py-3.5 px-6 rounded-[10px] font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-60">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>{sending ? "Sending…" : "Send message"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
