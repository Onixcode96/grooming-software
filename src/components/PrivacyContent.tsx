import { useSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";

const DEFAULT_POLICY = (businessName: string) => `# Privacy Policy & User Agreement

## 1. Titolare del Trattamento dei Dati

I dati personali sono raccolti e gestiti dal Salone di Toelettatura **${businessName}** indicato nella sezione Info/Settings dell'App. Utilizzando i nostri servizi, l'utente accetta le pratiche descritte in questa informativa.

## 2. Tipologia di Dati Raccolti

- **Dati dell'Utente:** Nome, cognome, email, telefono e indirizzo (per servizi a domicilio).
- **Dati dell'Animale:** Nome, razza, età, sesso, vaccinazioni, allergie, condizioni mediche e note comportamentali (es. aggressività).
- **Dati di Pagamento:** Gestiti tramite Stripe o circuiti bancari protetti. L'App non memorizza i dati completi della carta.

## 3. Finalità del Trattamento

- Gestire prenotazioni e agenda.
- Inviare conferme e aggiornamenti tramite notifiche o Chat interna.
- Garantire la sicurezza dell'animale conoscendo le sue necessità mediche.

## 4. Consenso Fotografico e Social Media

Salvo diniego scritto, il Salone può scattare foto/video dell'animale per:
- Portfolio professionale
- Pubblicazioni Social (Instagram/Facebook)
- Aggiornamenti in Chat

## 5. Sicurezza e Salute dell'Animale

Il proprietario certifica che l'animale è in regola con le vaccinazioni e si impegna a informare il personale di parassiti o problemi cardiaci/respiratori.

## 6. Diritti dell'Interessato

In conformità con **GDPR/CCPA**, l'utente può accedere, rettificare o richiedere la cancellazione dei dati e dell'account.`;

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

const renderContent = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith("# "))
      return <h1 key={i} className="text-xl font-extrabold font-heading text-foreground mt-6 mb-3">{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith("## "))
      return <h2 key={i} className="text-base font-bold font-heading text-foreground mt-5 mb-2">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("### "))
      return <h3 key={i} className="text-sm font-bold font-heading text-foreground mt-4 mb-1">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith("- ")) {
      const content = trimmed.slice(2);
      return (
        <div key={i} className="flex gap-2 ml-1 mb-1">
          <span className="text-primary mt-1 shrink-0">•</span>
          <span className="text-sm text-muted-foreground leading-relaxed">{renderInline(content)}</span>
        </div>
      );
    }
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">{renderInline(trimmed)}</p>;
  });
};

export const PrivacyContent = () => {
  const { data: settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const businessName = settings?.business_name || "PetGrooming";
  const rawContent = settings?.privacy_policy?.trim()
    ? settings.privacy_policy
    : DEFAULT_POLICY(businessName);

  return <div className="space-y-1">{renderContent(rawContent)}</div>;
};
