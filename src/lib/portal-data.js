export function safeSolutionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export const portalSolutions = [
  { id: 'goszakup', number: '01', name: 'Госзакуп', category: 'Сатып алу', icon: 'search', color: 'peach', url: safeSolutionUrl(import.meta.env.VITE_GOSZAKUP_URL), description: 'Мемлекеттік сатып алу деректерін жинау және өңдеу. Қажетті ақпаратпен бір жерден жұмыс істеу.', tags: ['Парсер', 'Деректер'], preview: ['Сатып алу деректері', 'Ақпаратты жинау', 'Деректерді өңдеу'] },
  { id: 'offers', number: '02', name: 'КП және құжаттар', category: 'Коммерция', icon: 'file', color: 'sage', url: safeSolutionUrl(import.meta.env.VITE_OFFERS_URL), description: 'Коммерциялық ұсыныстар мен басқа құжаттарды дайындауға арналған құралдар.', tags: ['Коммерциялық ұсыныс', 'Құжаттар'], preview: ['Коммерциялық ұсыныс', 'Құжатты дайындау', 'Нәтижені тексеру'] },
  { id: 'agreements', number: '03', name: 'Келісімшарттар', category: 'Заң бөлімі', icon: 'scale', color: 'lavender', url: safeSolutionUrl(import.meta.env.VITE_AGREEMENTS_URL), description: 'Заңгерлердің келісімшарт дайындау жұмысын жеңілдететін бағдарлама. Соңғы тексеру маманның қолында.', tags: ['Заңгерлерге', 'Келісімшарт'], preview: ['Келісімшарт дайындау', 'Мәтінмен жұмыс', 'Заңгердің тексеруі'] },
  { id: 'edumax', number: '04', name: 'EduMax', category: 'Білім беру', icon: 'school', color: 'sand', url: safeSolutionUrl(import.meta.env.VITE_EDUMAX_URL), description: 'Мектепке дейінгі дайындық оқытушыларына арналған курстар платформасы үшін тіркеу бағдарламасы.', tags: ['Оқытушылар', 'Тіркеу'], preview: ['Оқытушыларды тіркеу', 'Курсқа қатысушылар', 'Тіркеуді ұйымдастыру'] },
];
