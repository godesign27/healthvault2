type ClassInput = string | false | null | undefined | 0;

export function cn(...inputs: ClassInput[]): string {
  return inputs.filter(Boolean).join(' ');
}
