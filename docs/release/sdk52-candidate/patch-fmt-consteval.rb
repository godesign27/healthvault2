# SDK 52 candidate only: backport https://github.com/fmtlib/fmt/pull/4612.
# Preserve compile-time validation; do not disable FMT_USE_CONSTEVAL.
def patch_fmt_consteval(pods_root)
  base = File.join(pods_root, 'fmt/include/fmt/base.h')
  header = File.join(pods_root, 'fmt/include/fmt/format.h')
  raise 'Review fmt backport for changed version' unless File.read(base).include?('#define FMT_VERSION 110002')
  original = '#define FMT_STRING(s) FMT_STRING_IMPL(s, fmt::detail::compile_string, )'
  replacement = "#if FMT_USE_CONSTEVAL\n#  define FMT_STRING(s) s\n#else\n#  define FMT_STRING(s) FMT_STRING_IMPL(s, fmt::detail::compile_string, )\n#endif  // FMT_USE_CONSTEVAL"
  source = File.read(header)
  return if source.include?(replacement)
  raise 'Unexpected fmt header; review upstream patch' unless source.scan(original).size == 1
  File.chmod(File.stat(header).mode | 0200, header)
  File.write(header, source.sub(original, replacement))
end
patch_fmt_consteval(ARGV.fetch(0)) if $PROGRAM_NAME == __FILE__
