import { db } from "./db";
import { users, providers, categories, providerCategories, services, reviews, serviceOrders } from "@shared/schema";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";

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
  { name: "Saúde e Bem-estar", icon: "heart", description: "Fisioterapia, massagem, enfermagem" },
  { name: "Eventos", icon: "calendar", description: "Decoração, buffet, fotografia" },
];

const angolaCities = [
  "Luanda", "Benguela", "Huambo", "Lobito", "Cabinda", 
  "Lubango", "Malanje", "Namibe", "Soyo", "Uíge"
];

const providerData = [
  { name: "João Manuel", city: "Luanda", phone: "+244 923 456 789", whatsapp: "+244923456789", facebook: "joaomanuel.servicos" },
  { name: "Maria Santos", city: "Luanda", phone: "+244 924 567 890", whatsapp: "+244924567890", facebook: "mariasantos.clean" },
  { name: "Pedro Domingos", city: "Benguela", phone: "+244 925 678 901", whatsapp: "+244925678901", facebook: "pedrodomingos.tech" },
  { name: "Ana Cristina", city: "Huambo", phone: "+244 926 789 012", whatsapp: "+244926789012", facebook: "anacristina.beauty" },
  { name: "Carlos Eduardo", city: "Luanda", phone: "+244 927 890 123", whatsapp: "+244927890123", facebook: "carloseduardo.reparos" },
  { name: "Fernanda Silva", city: "Lobito", phone: "+244 928 901 234", whatsapp: "+244928901234", facebook: "fernandasilva.aulas" },
  { name: "António José", city: "Cabinda", phone: "+244 929 012 345", whatsapp: "+244929012345", facebook: "antoniojose.construcao" },
  { name: "Rosa Maria", city: "Lubango", phone: "+244 930 123 456", whatsapp: "+244930123456", facebook: "rosamaria.jardim" },
  { name: "Miguel Fernandes", city: "Luanda", phone: "+244 931 234 567", whatsapp: "+244931234567", facebook: "miguelfernandes.tech" },
  { name: "Beatriz Costa", city: "Malanje", phone: "+244 932 345 678", whatsapp: "+244932345678", facebook: "beatrizcosta.beauty" },
  { name: "Ricardo Oliveira", city: "Luanda", phone: "+244 933 456 789", whatsapp: "+244933456789", facebook: "ricardooliveira.eventos" },
  { name: "Sandra Pereira", city: "Namibe", phone: "+244 934 567 890", whatsapp: "+244934567890", facebook: "sandrapereira.saude" },
  { name: "Paulo André", city: "Benguela", phone: "+244 935 678 901", whatsapp: "+244935678901", facebook: "pauloandre.transporte" },
  { name: "Catarina Lopes", city: "Luanda", phone: "+244 936 789 012", whatsapp: "+244936789012", facebook: "catarinalopes.limpeza" },
  { name: "Francisco Nunes", city: "Soyo", phone: "+244 937 890 123", whatsapp: "+244937890123", facebook: "francisconunes.reparos" },
  { name: "Teresa Alves", city: "Huambo", phone: "+244 938 901 234", whatsapp: "+244938901234", facebook: "teresaalves.aulas" },
  { name: "Luís Alberto", city: "Luanda", phone: "+244 939 012 345", whatsapp: "+244939012345", facebook: "luisalberto.construcao" },
  { name: "Margarida Costa", city: "Uíge", phone: "+244 940 123 456", whatsapp: "+244940123456", facebook: "margaridacosta.beauty" },
  { name: "Joaquim Pereira", city: "Luanda", phone: "+244 941 234 567", whatsapp: "+244941234567", facebook: "joaquimpereira.tech" },
  { name: "Helena Fernandes", city: "Benguela", phone: "+244 942 345 678", whatsapp: "+244942345678", facebook: "helenafernandes.eventos" },
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

const serviceTemplates = [
  { suffix: "Básico", priceMultiplier: 0.5, duration: 60 },
  { suffix: "Completo", priceMultiplier: 1, duration: 120 },
  { suffix: "Premium", priceMultiplier: 1.5, duration: 180 },
  { suffix: "Express", priceMultiplier: 0.8, duration: 45 },
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
  "Superou minhas expectativas!",
  "Muito profissional e educado.",
  "Trabalho de primeira qualidade.",
  "Atendimento excepcional.",
  "Voltarei a contratar com certeza.",
];

const clientData = [
  { name: "Cliente Demo", email: "demo@servicoja.ao", city: "Luanda" },
  { name: "Ana Mendes", email: "ana.mendes@email.com", city: "Luanda" },
  { name: "Bruno Cardoso", email: "bruno.cardoso@email.com", city: "Benguela" },
  { name: "Carla Sousa", email: "carla.sousa@email.com", city: "Huambo" },
  { name: "Daniel Gomes", email: "daniel.gomes@email.com", city: "Lobito" },
  { name: "Eva Martins", email: "eva.martins@email.com", city: "Cabinda" },
  { name: "Filipe Santos", email: "filipe.santos@email.com", city: "Lubango" },
  { name: "Graça Ferreira", email: "graca.ferreira@email.com", city: "Luanda" },
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
    for (const client of clientData) {
      const [created] = await db.insert(users).values({
        email: client.email,
        password: hashPassword("123456"),
        name: client.name,
        phone: "+244 9" + Math.floor(10000000 + Math.random() * 90000000),
        city: client.city,
        role: "client",
      }).returning();
      createdClients.push(created);
    }

    console.log("Creating providers...");
    const createdProviders: { id: string; userId: string }[] = [];
    for (let i = 0; i < providerData.length; i++) {
      const providerInfo = providerData[i];
      const email = `provider${i + 1}@servicoja.ao`;
      
      const [user] = await db.insert(users).values({
        email,
        password: hashPassword("123456"),
        name: providerInfo.name,
        phone: providerInfo.phone,
        city: providerInfo.city,
        role: "provider",
        photoUrl: `https://i.pravatar.cc/300?u=${email}`,
      }).returning();

      const hourlyRate = (Math.floor(Math.random() * 40) + 10) * 100;
      const isVerified = Math.random() > 0.4;

      const [prov] = await db.insert(providers).values({
        userId: user.id,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        hourlyRate: hourlyRate.toString(),
        city: providerInfo.city,
        whatsapp: providerInfo.whatsapp,
        facebook: providerInfo.facebook,
        isVerified,
        isOnline: Math.random() > 0.5,
        totalRatings: 0,
        averageRating: "0",
      }).returning();

      createdProviders.push({ id: prov.id, userId: user.id });

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

      const numServices = Math.floor(Math.random() * 3) + 1;
      const selectedTemplates = [...serviceTemplates]
        .sort(() => Math.random() - 0.5)
        .slice(0, numServices);

      for (const template of selectedTemplates) {
        const categoryName = selectedCategories[0].name;
        await db.insert(services).values({
          providerId: prov.id,
          categoryId: selectedCategories[0].id,
          name: `${categoryName} ${template.suffix}`,
          description: `Serviço de ${categoryName.toLowerCase()} - pacote ${template.suffix.toLowerCase()}. Inclui materiais básicos e garantia.`,
          price: Math.round(hourlyRate * template.priceMultiplier).toString(),
          duration: template.duration,
          isActive: true,
        });
      }
    }

    console.log("Creating service orders and reviews...");
    for (const prov of createdProviders) {
      const numOrders = Math.floor(Math.random() * 5) + 2;
      let totalRating = 0;
      let reviewCount = 0;

      for (let i = 0; i < numOrders; i++) {
        const client = createdClients[Math.floor(Math.random() * createdClients.length)];
        const statuses = ['completed', 'completed', 'completed', 'pending', 'in_progress'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const daysAgo = Math.floor(Math.random() * 60);
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() - daysAgo);

        const [order] = await db.insert(serviceOrders).values({
          clientId: client.id,
          providerId: prov.id,
          status,
          scheduledDate,
          completedDate: status === 'completed' ? scheduledDate : null,
          price: (Math.floor(Math.random() * 3000) + 500).toString(),
          clientNotes: Math.random() > 0.5 ? "Preciso do serviço o mais rápido possível." : null,
        }).returning();

        if (status === 'completed' && Math.random() > 0.2) {
          const rating = Math.floor(Math.random() * 2) + 4;
          totalRating += rating;
          reviewCount++;

          await db.insert(reviews).values({
            providerId: prov.id,
            clientId: client.id,
            orderId: order.id,
            rating,
            comment: Math.random() > 0.2 
              ? reviewComments[Math.floor(Math.random() * reviewComments.length)]
              : null,
          });
        }
      }

      if (reviewCount > 0) {
        const averageRating = (totalRating / reviewCount).toFixed(1);
        await db.update(providers)
          .set({ totalRatings: reviewCount, averageRating })
          .where(eq(providers.id, prov.id));
      }
    }

    console.log("Seed completed successfully!");
    console.log(`Created: ${createdCategories.length} categories, ${createdClients.length} clients, ${createdProviders.length} providers`);
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}

seed().catch(console.error);
