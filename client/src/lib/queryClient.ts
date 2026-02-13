import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "./config"; // <--- ADDED

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepend API URL if not already present
 // const fullUrl = url.startsWith('http') ? url : `${config.apiUrl}${url}`; // <--- MODIFIED
const fullUrl = url.startsWith("http")
  ? url
  : `${config.apiUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;



  const res = await fetch(fullUrl, { // <--- MODIFIED
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = queryKey.join("/") as string;
  //  const fullUrl = url.startsWith('http') ? url : `${config.apiUrl}${url}`; // <--- ADDED
    
const fullUrl = url.startsWith("http")
  ? url
  : `${config.apiUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

    const res = await fetch(fullUrl, { // <--- MODIFIED
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // TIER 4: React Query Optimization
      staleTime: 5 * 60 * 1000,             // 🔥 5 min (don't cache forever)
      gcTime: 10 * 60 * 1000,               // 🔥 Keep in memory 10 min
      refetchOnWindowFocus: true,           // 🔥 Refetch when user returns
      refetchOnMount: 'stale',              // 🔥 Refetch if data is stale on mount
      refetchInterval: 30 * 60 * 1000,      // 🔥 Background refetch every 30 min
      retry: 1,                             // 🔥 Retry once on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
