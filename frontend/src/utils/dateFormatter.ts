// Күнтізбе форматтау утилитасы - қазақша ай атауларымен

const monthNamesKazakh: Record<string, { short: string; long: string }> = {
  '0': { short: 'Қаң', long: 'Қаңтар' },
  '1': { short: 'Ақп', long: 'Ақпан' },
  '2': { short: 'Нау', long: 'Наурыз' },
  '3': { short: 'Сәу', long: 'Сәуір' },
  '4': { short: 'Мам', long: 'Мамыр' },
  '5': { short: 'Мау', long: 'Маусым' },
  '6': { short: 'Шіл', long: 'Шілде' },
  '7': { short: 'Там', long: 'Тамыз' },
  '8': { short: 'Қыр', long: 'Қыркүйек' },
  '9': { short: 'Қаз', long: 'Қазан' },
  '10': { short: 'Қар', long: 'Қараша' },
  '11': { short: 'Жел', long: 'Желтоқсан' },
};

const monthNamesEnglish: Record<string, { short: string; long: string }> = {
  '0': { short: 'Jan', long: 'January' },
  '1': { short: 'Feb', long: 'February' },
  '2': { short: 'Mar', long: 'March' },
  '3': { short: 'Apr', long: 'April' },
  '4': { short: 'May', long: 'May' },
  '5': { short: 'Jun', long: 'June' },
  '6': { short: 'Jul', long: 'July' },
  '7': { short: 'Aug', long: 'August' },
  '8': { short: 'Sep', long: 'September' },
  '9': { short: 'Oct', long: 'October' },
  '10': { short: 'Nov', long: 'November' },
  '11': { short: 'Dec', long: 'December' },
};

const monthNamesRussian: Record<string, { short: string; long: string }> = {
  '0': { short: 'Янв', long: 'Январь' },
  '1': { short: 'Фев', long: 'Февраль' },
  '2': { short: 'Мар', long: 'Март' },
  '3': { short: 'Апр', long: 'Апрель' },
  '4': { short: 'Май', long: 'Май' },
  '5': { short: 'Июн', long: 'Июнь' },
  '6': { short: 'Июл', long: 'Июль' },
  '7': { short: 'Авг', long: 'Август' },
  '8': { short: 'Сен', long: 'Сентябрь' },
  '9': { short: 'Окт', long: 'Октябрь' },
  '10': { short: 'Ноя', long: 'Ноябрь' },
  '11': { short: 'Дек', long: 'Декабрь' },
};

export const formatDate = (dateString: string, locale: string = 'kk', format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth().toString();
  const year = date.getFullYear();

  let monthNames: Record<string, { short: string; long: string }>;
  
  if (locale === 'kk') {
    monthNames = monthNamesKazakh;
  } else if (locale === 'ru') {
    monthNames = monthNamesRussian;
  } else {
    monthNames = monthNamesEnglish;
  }

  const monthName = monthNames[month]?.[format] || monthNames[month]?.short || '';
  
  return `${day} ${monthName} ${year}`;
};

export const formatDateTime = (dateString: string, locale: string = 'kk', format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth().toString();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  let monthNames: Record<string, { short: string; long: string }>;
  
  if (locale === 'kk') {
    monthNames = monthNamesKazakh;
  } else if (locale === 'ru') {
    monthNames = monthNamesRussian;
  } else {
    monthNames = monthNamesEnglish;
  }

  const monthName = monthNames[month]?.[format] || monthNames[month]?.short || '';
  
  return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
};