/**
 * 조건부 class 이름 합치기: cx('btn', active && 'is-active') → 'btn is-active'.
 * className 템플릿 문자열(`a${b ? ' c' : ''}`)은 prettier-plugin-tailwindcss 가 앞 공백을 지워 class 가 붙어 버리므로 이걸 쓴다.
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
