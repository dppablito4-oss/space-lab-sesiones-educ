"""Record the installed runtime lock in the engine and alongside its binary."""
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import platform
import sys

from packaging.requirements import Requirement

ROOT = Path(__file__).resolve().parents[1]


def write_inventory(output: Path) -> dict:
    lock = ROOT / 'backend/requirements.lock.txt'
    packages = []
    for line in lock.read_text(encoding='utf-8').splitlines():
        if not line or line[0].isspace() or line.startswith('#'):
            continue
        requirement = Requirement(line.rstrip(' \\'))
        if requirement.marker and not requirement.marker.evaluate():
            continue
        installed = version(requirement.name)
        if not requirement.specifier.contains(installed):
            raise RuntimeError(f'{requirement.name} does not match the runtime lock')
        packages.append({'name':requirement.name,'version':installed})
    sys.path.insert(0, str(ROOT / 'backend'))
    from version import ENGINE_VERSION
    inventory = {'engineVersion':ENGINE_VERSION,'python':platform.python_version(),
                 'platform':sys.platform,'source':'Installed runtime lock; optional modules may be excluded by PyInstaller',
                 'lockSha256':hashlib.sha256(lock.read_bytes()).hexdigest(),'packages':packages}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(inventory, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    return inventory


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'backend/build/engine-dependencies.json')
    print(f'Recorded {len(write_inventory(parser.parse_args().output)["packages"])} runtime packages.')
