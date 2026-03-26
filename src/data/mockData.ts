export const dogBreeds = [
  "Not specified", "Labrador Retriever", "Golden Retriever", "Bulldog", "Barboncino", "Beagle",
  "Pastore Tedesco", "Yorkshire Terrier", "Chihuahua", "Shih Tzu", "Maltese",
  "Cocker Spaniel", "Border Collie", "Jack Russell", "Boxer", "Husky Siberiano",
  "Cavalier King Charles", "Bassotto", "Pomerania", "Carlino", "Meticcio"
];

export const catBreeds = [
  "Not specified", "Persiano", "Maine Coon", "Siamese", "Ragdoll", "British Shorthair",
  "Bengala", "Sphynx", "Abissino", "Europeo", "Sacro di Birmania",
  "Norwegian Forest", "Scottish Fold", "Certosino", "Exotic Shorthair", "Meticcio"
];

export const petSizes = [
  { id: "xs", label: "Mini", weight: "< 5 kg", icon: "🐾" },
  { id: "sm", label: "Piccolo", weight: "5 - 10 kg", icon: "🐕" },
  { id: "md", label: "Medio", weight: "10 - 25 kg", icon: "🐕‍🦺" },
  { id: "lg", label: "Grande", weight: "25 - 45 kg", icon: "🦮" },
  { id: "xl", label: "Gigante", weight: "> 45 kg", icon: "🐻" },
];

// Reviews are placeholder data until a reviews table is created in the database
export interface Review {
  id: string;
  clientName: string;
  petName: string;
  service: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
}

export const mockReviews: Review[] = [
  { id: "1", clientName: "Marco Rossi", petName: "Luna", service: "Toelettatura Completa", rating: 5, comment: "Luna è tornata a casa bellissima! Profumo fantastico e taglio perfetto. Super consigliato! 🌟", date: "2026-01-28", reply: "Grazie Marco! Luna è sempre un piacere, ci vediamo presto! 🐾" },
  { id: "2", clientName: "Giulia Bianchi", petName: "Micio", service: "Bagno & Asciugatura", rating: 4, comment: "Molto professionali e attenti con Micio che è un po' timoroso. Ottimo lavoro!", date: "2026-01-25" },
  { id: "3", clientName: "Sara Colombo", petName: "Pallina", service: "Trattamento SPA", rating: 5, comment: "Pallina sembra un'altra gatta! Il pelo è morbidissimo. Esperienza top!", date: "2026-01-20", reply: "Pallina è stata bravissima! 😻" },
  { id: "4", clientName: "Luca Verdi", petName: "Rocky", service: "Solo Tosatura", rating: 4, comment: "Buon lavoro con Rocky che è sempre agitato. Bravi a gestirlo.", date: "2026-01-15" },
];
