// Date formatting utility - uses i18n for month names

import i18n from '../i18n/config';

export const formatDate = (dateString: string, locale?: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.getMonth().toString();
  const year = date.getFullYear();

  const lng = locale || i18n.language || 'kk';
  const monthName = i18n.t(`dateFormatter.months.${month}.${format}`, { lng }) || i18n.t(`dateFormatter.months.${month}.short`, { lng }) || '';

  return `${day} ${monthName} ${year}`;
};

export const formatDateTime = (dateString: string, locale?: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.getMonth().toString();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const lng = locale || i18n.language || 'kk';
  const monthName = i18n.t(`dateFormatter.months.${month}.${format}`, { lng }) || i18n.t(`dateFormatter.months.${month}.short`, { lng }) || '';

  return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
};