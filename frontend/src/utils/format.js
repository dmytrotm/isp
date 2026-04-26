export const formatCurrency = (amount) => 
  new Intl.NumberFormat('uk-UA', { 
    style: 'currency', 
    currency: 'UAH' 
  }).format(amount)

export const formatDate = (date) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).format(new Date(date))

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
