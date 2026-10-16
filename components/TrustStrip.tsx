import { IconLock, IconShield, IconWhatsApp } from "@/components/Icons";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ITEMS = [
  { Icon: IconShield, title: "POPIA-friendly", body: "A consent tick per customer, and a STOP list that keeps opted-out numbers out of your queue for good." },
  { Icon: IconLock, title: "Your list stays with you", body: "On the free plan your customers are saved on your own device. We don't read or sell them." },
  { Icon: IconWhatsApp, title: "Sent from your number", body: "Messages go from your own WhatsApp, so customers see a name they know. You stay in control of every send." },
];

export default function TrustStrip() {
  return (
    <Card className="rounded-2xl bg-white p-5 sm:p-6" aria-labelledby="trust-h">
      <h2 id="trust-h" className="text-3xl">Made for South African trades, built to be trusted</h2>
      <Separator className="my-3 bg-line" />
      <ul className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map(({ Icon, title, body }) => (
          <li key={title} className="group space-y-1.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-go-tint text-go transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]">
              <Icon className="h-5 w-5" />
            </span>
            <p className="font-bold">{title}</p>
            <p className="hint">{body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
