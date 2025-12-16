import { QueryClient } from "@tanstack/react-query";
import { 
  categoriesService, 
  providersService, 
  usersService,
  servicesService,
  reviewsService,
  conversationsService,
  messagesService,
  favoritesService,
  serviceOrdersService
} from "./firestore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export {
  categoriesService,
  providersService,
  usersService,
  servicesService,
  reviewsService,
  conversationsService,
  messagesService,
  favoritesService,
  serviceOrdersService
};
