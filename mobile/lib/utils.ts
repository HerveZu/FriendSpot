export function capitalize(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function notEmpty(value: string | undefined): boolean {
  return !!value && value.replace(/\s/g, '').length > 0;
}

export function minLength(length: number): (value?: string) => boolean {
  return (value?: string) => !!value && value.length >= length;
}

export function omitObj<T>(obj: T): T {
  const magicObj = obj as any;
  return Object.keys(magicObj).reduce((acc, key) => {
    if (magicObj[key] === undefined) {
      return acc;
    }
    // @ts-ignore
    acc[key] = obj[key];
    return acc;
  }, {}) as T;
}
