// Эта функция нормализует process.env:
// пустые строки и строки из пробелов превращаются в undefined,
// чтобы дальше код работал не с "пустым значением", а с явным отсутствием конфигурации.
const readOptional = (name: string): string | undefined => {
  // optional chaining защищает от вызова trim() на undefined.
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

// Единый объект-конфиг удобнее, чем десятки прямых обращений к process.env по всему проекту.
export const env = {
  baseUrl: readOptional('BASE_URL'),
  username: readOptional('USERNAME'),
  password: readOptional('PASSWORD'),
};
