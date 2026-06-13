/**
 * Normalize phone number to standard international format without symbols (e.g. 62812345678)
 */
export const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Format currency to IDR format without decimals (e.g. 150.000)
 */
export const formatIDR = (amount: number | string): string => {
  const num = Number(amount);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

interface TemplateVariables {
  reseller_name: string;
  shop_name: string;
  product_name: string;
  price: number | string;
}

/**
 * Compile WhatsApp template by replacing placeholders
 */
export const compileWhatsappMessage = (template: string, vars: TemplateVariables): string => {
  let message = template;
  message = message.replace(/{reseller_name}/g, vars.reseller_name);
  message = message.replace(/{shop_name}/g, vars.shop_name);
  message = message.replace(/{product_name}/g, vars.product_name);
  message = message.replace(/{price}/g, formatIDR(vars.price));
  return message;
};

/**
 * Generate fully formatted wa.me link
 */
export const generateWhatsappLink = (phone: string, text: string): string => {
  const normalizedPhone = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
};
