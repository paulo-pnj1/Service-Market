import { db } from "./db";
import { users, providers, categories, providerCategories, services, reviews } from "@shared/schema";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const categoryData = [
  { name: "Reparos Domésticos", icon: "tool", description: "Eletricista, canalizador, carpinteiro e mais" },
  { name: "Limpeza", icon: "home", description: "Limpeza residencial e comercial" },
  { name: "Aulas Particulares", icon: "book-open", description: "Professores de todas as matérias" },
  { name: "Beleza e Estética", icon: "scissors", description: "Cabeleireiros, manicures, maquiadores" },
  { name: "Tecnologia", icon: "monitor", description: "Suporte técnico, desenvolvimento, redes" },
  { name: "Construção", icon: "hard-hat", description: "Pedreiros, pintores, azulejistas" },
  { name: "Jardinagem", icon: "sun", description: "Paisagismo e manutenção de jardins" },
  { name: "Transporte", icon: "truck", description: "Mudanças e entregas" },
];

const angolaCities = [
  "Luanda", "Benguela", "Huambo", "Lobito", "Cabinda", 
  "Lubango", "Malanje", "Namibe", "Soyo", "Uíge"
];

const providerNames = [
  { name: "João Manuel", city: "Luanda" },
  { name: "Maria Santos", city: "Luanda" },
  { name: "Pedro Domingos", city: "Benguela" },
  { name: "Ana Cristina", city: "Huambo" },
  { name: "Carlos Eduardo", city: "Luanda" },
  { name: "Fernanda Silva", city: "Lobito" },
  { name: "António José", city: "Cabinda" },
  { name: "Rosa Maria", city: "Lubango" },
  { name: "Miguel Fernandes", city: "Luanda" },
  { name: "Beatriz Costa", city: "Malanje" },
  { name: "Ricardo Oliveira", city: "Luanda" },
  { name: "Sandra Pereira", city: "Namibe" },
  { name: "Paulo André", city: "Benguela" },
  { name: "Catarina Lopes", city: "Luanda" },
  { name: "Francisco Nunes", city: "Soyo" },
  { name: "Teresa Alves", city: "Huambo" },
  { name: "Luís Alberto", city: "Luanda" },
  { name: "Margarida Costa", city: "Uíge" },
  { name: "Joaquim Pereira", city: "Luanda" },
  { name: "Helena Fernandes", city: "Benguela" },
];

const descriptions = [
  "Profissional experiente com mais de 10 anos no mercado. Qualidade garantida.",
  "Trabalho com dedicação e pontualidade. Orçamento grátis!",
  "Especialista certificado. Atendimento rápido em toda a região.",
  "Serviço de qualidade a preços justos. Consulte nossas promoções.",
  "Profissional de confiança. Milhares de clientes satisfeitos.",
  "Atendimento personalizado para cada cliente. Ligue agora!",
  "Experiência internacional. Melhores técnicas do mercado.",
  "Comprometimento total com a satisfação do cliente.",
  "Profissional formado e certificado. Garantia de serviço.",
  "Atendemos residências e empresas. Consulte disponibilidade.",
];

const reviewComments = [
  "Excelente profissional! Muito recomendado.",
  "Trabalho impecável, voltarei a contratar.",
  "Pontual e eficiente. Ótimo atendimento.",
  "Serviço de qualidade. Preço justo.",
  "Muito satisfeito com o resultado.",
  "Profissional dedicado e atencioso.",
  "Recomendo a todos! Trabalho perfeito.",
  "Ótima experiência. Profissional nota 10.",
  "Serviço rápido e bem feito.",
  "Excelente custo-benefício.",
];

const clientNames = [
  { name: "Cliente Teste 1", email: "cliente1@teste.com" },
  { name: "Cliente Teste 2", email: "cliente2@teste.com" },
  { name: "Cliente Teste 3", email: "cliente3@teste.com" },
  { name: "Cliente Teste 4", email: "cliente4@teste.com" },
  { name: "Cliente Teste 5", email: "cliente5@teste.com" },
];

export async function seed() {
  console.log("Starting seed...");

  try {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Creating categories...");
    const createdCategories: { id: string; name: string }[] = [];
    for (const cat of categoryData) {
      const [created] = await db.insert(categories).values(cat).returning();
      createdCategories.push(created);
    }

    console.log("Creating client users...");
    const createdClients: { id: string }[] = [];
    for (const client of clientNames) {
      const [created] = await db.insert(users).values({
        email: client.email,
        password: hashPassword("123456"),
        name: client.name,
        city: angolaCities[Math.floor(Math.random() * angolaCities.length)],
        role: "client",
      }).returning();
      createdClients.push(created);
    }

    console.log("Creating providers...");
    const createdProviders: { id: string }[] = [];
    for (let i = 0; i < providerNames.length; i++) {
      const provider = providerNames[i];
      const email = `provider${i + 1}@servicoja.ao`;
      
      const [user] = await db.insert(users).values({
        email,
        password: hashPassword("123456"),
        name: provider.name,
        city: provider.city,
        role: "provider",
      }).returning();

      const hourlyRate = (Math.floor(Math.random() * 40) + 10) * 100;
      const isVerified = Math.random() > 0.4;

      const [prov] = await db.insert(providers).values({
        userId: user.id,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        hourlyRate: hourlyRate.toString(),
        city: provider.city,
        isVerified,
        totalRatings: 0,
        averageRating: "0",
      }).returning();

      createdProviders.push(prov);

      const numCategories = Math.floor(Math.random() * 2) + 1;
      const selectedCategories = [...createdCategories]
        .sort(() => Math.random() - 0.5)
        .slice(0, numCategories);

      for (const cat of selectedCategories) {
        await db.insert(providerCategories).values({
          providerId: prov.id,
          categoryId: cat.id,
        });
      }

      const serviceName = selectedCategories[0].name;
      await db.insert(services).values({
        providerId: prov.id,
        name: `Serviço de ${serviceName}`,
        description: `Oferecemos serviços completos de ${serviceName.toLowerCase()} com qualidade garantida.`,
        price: hourlyRate.toString(),
      });

      if (Math.random() > 0.3) {
        await db.insert(services).values({
          providerId: prov.id,
          name: `Consultoria ${serviceName}`,
          description: `Avaliação e consultoria especializada em ${serviceName.toLowerCase()}.`,
          price: (hourlyRate * 0.5).toString(),
        });
      }
    }

    console.log("Creating reviews...");
    for (const prov of createdProviders) {
      const numReviews = Math.floor(Math.random() * 8) + 2;
      let totalRating = 0;

      for (let i = 0; i < numReviews; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const rating = Math.floor(Math.random() * 2) + 4;
        totalRating += rating;

        await db.insert(reviews).values({
          providerId: prov.id,
          clientId: client.id,
          rating,
          comment: Math.random() > 0.3 
            ? reviewComments[Math.floor(Math.random() * reviewComments.length)]
            : null,
        });
      }

      const averageRating = (totalRating / numReviews).toFixed(1);
      await db.update(providers)
        .set({ totalRatings: numReviews, averageRating })
        .where(require("drizzle-orm").eq(providers.id, prov.id));
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}

seed().catch(console.error);
