"""Run with the candidate's Pods directory; needs Xcode command-line tools."""
import pathlib
import subprocess
import sys
import tempfile

pods = pathlib.Path(sys.argv[1]).resolve()
include = pods / 'fmt/include'
cases = {
    'valid': '#include <fmt/format.h>\nint main(){return fmt::format(FMT_STRING("{}"),42)=="42"?0:1;}\n',
    'invalid': '#include <fmt/format.h>\nint main(){fmt::format(FMT_STRING("{:d}"),"foo");}\n',
}
with tempfile.TemporaryDirectory(prefix='hv-fmt-check-') as directory:
    for standard in ['c++17', 'c++20']:
        for name, source in cases.items():
            path = pathlib.Path(directory) / (name + '.cc')
            path.write_text(source)
            binary = pathlib.Path(directory) / 'check'
            result = subprocess.run(
                ['xcrun', 'clang++', '-std=' + standard, '-DFMT_HEADER_ONLY',
                 '-I' + str(include), str(path), '-o', str(binary)],
                capture_output=True, text=True,
            )
            assert (result.returncode == 0) == (name == 'valid'), result.stderr
            if name == 'valid':
                subprocess.run([str(binary)], check=True)
            else:
                assert 'invalid format specifier' in result.stderr, result.stderr
            print(standard, name, 'PASS')
