// Automatically determine backend URL based on current host if not specified in env
const isDev = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL || (isDev ? `http://${window.location.hostname}:4000` : "https://api.dookon.uz");

/** Agar backend global prefix ishlatsa: app.setGlobalPrefix('api')
 *  unda API_PREFIX = '/api' bo‘lib qoladi.
 *  Agar backendda prefix bo‘lmasa, API_PREFIX ni '' qiling.
 */
const API_PREFIX = "/api";

/** URL ni toza yig‘ish (// bo‘lib ketmasin) */
function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  purchase_price: number;
  profit_percent: number;
  selling_price: number;
  discount_percent: number;
  image_url: string | null;
  stock_quantity: number;
  min_stock_alert: number;
  unit: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  start_at?: string | null;
  end_at?: string | null;
  active: boolean;
  created_at: string;
}

export interface PromotionProduct {
  id: string;
  promotion_id: string;
  product_id: string;
  override_discount_type?: "percent" | "fixed" | null;
  override_discount_value?: number | null;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface DebtSale {
  id: string;
  debt_id: string;
  sale_id: string;
}

export interface SaleItemInput {
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SaleInput {
  sale_number: string;
  total_amount: number;
  payment_type: "naqd" | "karta" | "qarz";
  cashier_name: string;
  items: SaleItemInput[];
  debt?: { customer_name: string; customer_phone: string };
}

export interface Debt {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  sale_id: string | null;
  status: string;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Sale {
  id: string;
  store_id: string;
  sale_number: string;
  total_amount: number;
  payment_type: string;
  cashier_name: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function makeQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}


export interface LoginResponse {
  token: string;
  user: { id: string; username: string; role: string };
  store: { id: string; name: string; plan: string };
}

export interface RegisterStoreInput {
  name: string;
  phone: string;
  password: string;
  ownerName: string;
  partnerId?: string;
  partnerLogin?: string;
}

async function http<T>(
  path: string,
  options?: { method?: HttpMethod; body?: any; headers?: Record<string, string> }
): Promise<T> {
  const url = joinUrl(API_URL, `${API_PREFIX}${path}`);


  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Token is now sent via HttpOnly Cookie
    ...(options?.headers || {}),
  };

  const method = options?.method || "GET";

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include', // Important for HttpOnly Cookies
  };

  if (options?.body !== undefined) {
    init.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, init);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  // Body ni xavfsiz o‘qish
  const payload: any = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    // Backend JSON error qaytarsa: {message} yoki {error}
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload) ||
      `HTTP ${res.status} ${res.statusText}`;

    throw new Error(message);
  }

  return payload as T;
}

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'CASHIER' | 'WAREHOUSE' | 'DELIVERY' | 'OWNER' | 'SUPER_ADMIN';
  created_at: string;
}

export const api = {
  auth: {
    login: (data: any) => http<LoginResponse>('/auth/login', { method: 'POST', body: data }),
    logout: () => http<{ message: string }>('/auth/logout', { method: 'POST' }),
    registerStore: (data: RegisterStoreInput) => http<{ message: string; storeId: string }>('/auth/register', { method: 'POST', body: data }),
  },
  products: {
    list: (params?: { inStock?: boolean; search?: string }) =>
      http<Product[]>(
        `/products${makeQuery({
          inStock: params?.inStock ? true : undefined,
          search: params?.search,
        })}`
      ),
    getById: (id: string) => http<Product>(`/products/${id}`),
    create: (data: Omit<Product, "id" | "created_at">) => http<Product>(`/products`, { method: "POST", body: data }),
    update: (id: string, data: Partial<Product>) => http<Product>(`/products/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => http<void>(`/products/${id}`, { method: "DELETE" }),
  },

  categories: {
    list: () => http<Category[]>(`/categories`),
    create: (data: { name: string }) => http<Category>(`/categories`, { method: "POST", body: data }),
  },

  sales: {
    create: (data: SaleInput) => http(`/sales`, { method: "POST", body: data }),
  },

  debts: {
    list: (status?: string) => http<Debt[]>(`/debts${makeQuery({ status })}`),
    payments: (debtId: string) => http<DebtPayment[]>(`/debts/${debtId}/payments`),
    getDetails: (debtId: string) => http<Debt & { payments: DebtPayment[], sales_links: { sale: Sale & { sale_items: (SaleItem & { product: Product })[] } }[] }>(`/debts/${debtId}/details`),
    addPayment: (debtId: string, amount: number) =>
      http(`/debts/${debtId}/payments`, { method: "POST", body: { amount } }),
  },

  orders: {
    list: (status?: string) => http<(Order & { order_items: OrderItem[] })[]>(`/orders${makeQuery({ status })}`),
    create: (data: {
      customer_name: string;
      customer_phone: string;
      customer_address?: string;
      total_amount: number;
      status?: string;
      notes?: string;
      items: { product_id: string; quantity: number; price: number; total: number }[];
    }) => http(`/orders`, { method: "POST", body: data }),
    updateStatus: (id: string, status: string) =>
      http(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
  },

  stats: {
    get: (params?: { period?: string }) =>
      http<{
        sales: number;
        profit: number;
        totalDebts: number;
        lowStockCount: number;
        oldStockCount: number;
        pendingOrders: number;
        totalProducts: number;
        salesTrend: { date: string; amount: number }[];
        topProducts: { name: string; quantity: number }[];
      }>(`/stats${makeQuery(params)}`),
  },

  promotions: {
    list: () => http<(Promotion & { products: PromotionProduct[] })[]>(`/promotions`),
    get: (id: string) => http<Promotion & { products: PromotionProduct[] }>(`/promotions/${id}`),
    create: (data: Partial<Promotion>) => http<Promotion>(`/promotions`, { method: "POST", body: data }),
    update: (id: string, data: Partial<Promotion>) => http<Promotion>(`/promotions/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => http<void>(`/promotions/${id}`, { method: "DELETE" }),
    setActive: (id: string, active: boolean) =>
      http<Promotion>(`/promotions/${id}/active`, { method: "PATCH", body: { active } }),
    attachProduct: (
      id: string,
      data: {
        product_id: string;
        override_discount_type?: "percent" | "fixed" | null;
        override_discount_value?: number | null;
      }
    ) => http<PromotionProduct>(`/promotions/${id}/products`, { method: "POST", body: data }),
    detachProduct: (id: string, product_id: string) =>
      http<void>(`/promotions/${id}/products/${product_id}`, { method: "DELETE" }),
  },

  bundles: {
    list: () => http<(Bundle & { items: BundleItem[] })[]>(`/bundles`),
    create: (data: Partial<Bundle>) => http<Bundle>(`/bundles`, { method: "POST", body: data }),
    update: (id: string, data: Partial<Bundle>) => http<Bundle>(`/bundles/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => http<void>(`/bundles/${id}`, { method: "DELETE" }),
    addItem: (id: string, data: { product_id: string; quantity: number }) =>
      http<BundleItem>(`/bundles/${id}/items`, { method: "POST", body: data }),
    updateItem: (id: string, product_id: string, data: { quantity: number }) =>
      http<BundleItem>(`/bundles/${id}/items/${product_id}`, { method: "PUT", body: data }),
    removeItem: (id: string, product_id: string) =>
      http<void>(`/bundles/${id}/items/${product_id}`, { method: "DELETE" }),
  },

  customers: {
    list: () => http<Customer[]>(`/customers`),
    create: (data: Partial<Customer>) => http<Customer>(`/customers`, { method: "POST", body: data }),
    update: (id: string, data: Partial<Customer>) => http<Customer>(`/customers/${id}`, { method: "PUT", body: data }),
    merge: (sourceId: string, targetId: string) =>
      http<Customer>(`/customers/merge`, { method: "POST", body: { sourceId, targetId } }),
  },

  admin: {
    setup: (data: any) => http('/admin/setup', { method: 'POST', body: data }),
    getStats: () => http<any>('/admin/stats'),
    getStores: () => http<any[]>('/admin/stores'),
    updateStore: (id: string, data: any) => http(`/admin/stores/${id}`, { method: 'PUT', body: data }),
    getPartners: () => http<any[]>('/admin/partners'),
    createPartner: (data: any) => http('/admin/partners', { method: 'POST', body: data }),
    updatePartner: (id: string, data: any) => http(`/admin/partners/${id}`, { method: 'PUT', body: data }),
    removePartner: (id: string) => http<void>(`/admin/partners/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: () => http<User[]>('/users'),
    create: (data: any) => http<User>('/users', { method: 'POST', body: data }),
    update: (id: string, data: any) => http<User>(`/users/${id}`, { method: 'PUT', body: data }),
    remove: (id: string) => http<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  shop: {
    getStore: (slug: string) => http<any>(`/shop/${slug}`),
    getProducts: (slug: string, params?: { category_id?: string; search?: string }) =>
      http<Product[]>(`/shop/${slug}/products${makeQuery(params)}`),
    getCategories: (slug: string) => http<Category[]>(`/shop/${slug}/categories`),
    getPromotions: (slug: string) => http<(Promotion & { products: PromotionProduct[] })[]>(`/shop/${slug}/promotions`),
    getBundles: (slug: string) => http<(Bundle & { items: BundleItem[] })[]>(`/shop/${slug}/bundles`),
    createOrder: (slug: string, data: any) => http(`/shop/${slug}/orders`, { method: 'POST', body: data }),
  },
  settings: {
    get: () => http<any>('/settings'),
    update: (data: any) => http<any>('/settings', { method: 'PUT', body: data }),
  },
  expenses: {
    list: (params?: any) => http<any[]>('/expenses' + makeQuery(params)),
    create: (data: any) => http<any>('/expenses', { method: 'POST', body: data }),
    delete: (id: string) => http<void>(`/expenses/${id}`, { method: 'DELETE' }),
  },
  logs: {
    list: (params?: any) => http<any[]>('/logs' + makeQuery(params)),
  },
  partner: {
    getStats: () => http<any>('/partner/portal/stats'),
    updateSettings: (data: any) => http<any>('/partner/portal/settings', { method: 'PUT', body: data }),
    createStore: (data: any) => http<any>('/partner/portal/stores', { method: 'POST', body: data }),
    updateStore: (id: string, data: any) => http<any>(`/partner/portal/stores/${id}`, { method: 'PUT', body: data }),
  }
};
