from pathlib import Path
from datetime import datetime
import shutil

files = [
    Path("/var/www/coin2win-ui/components/PlayerShell.tsx"),
    Path("/var/www/coin2win-ui/components/PlayerHeader.tsx"),
]

for file in files:
    src = file.read_text()
    backup = file.with_suffix(file.suffix + f".bak.{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(file, backup)

    src = src.replace(
        '    window.addEventListener("coin2win-auth-changed", refreshUser);',
        '    window.addEventListener("coin2win-auth-changed", refreshUser);\n'
        '    window.addEventListener("coin2win-wallet-changed", refreshUser);'
    )

    src = src.replace(
        '      window.removeEventListener("coin2win-auth-changed", refreshUser);',
        '      window.removeEventListener("coin2win-auth-changed", refreshUser);\n'
        '      window.removeEventListener("coin2win-wallet-changed", refreshUser);'
    )

    src = src.replace(
        '        const res = await fetch(`/api/wallet/${user.user_id}`, {',
        '        const res = await fetch(`/api/wallet/${user.user_id}`, {'
    )

    # add wallet event listener near loadWallet effect if not already there
    old_block = '''    loadWallet();
    const t = setInterval(loadWallet, 5000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user?.user_id]);'''

    new_block = '''    loadWallet();

    const handleWalletChanged = () => {
      loadWallet();
    };

    window.addEventListener("coin2win-auth-changed", handleWalletChanged);
    window.addEventListener("coin2win-wallet-changed", handleWalletChanged);

    const t = setInterval(loadWallet, 5000);

    return () => {
      cancelled = true;
      window.removeEventListener("coin2win-auth-changed", handleWalletChanged);
      window.removeEventListener("coin2win-wallet-changed", handleWalletChanged);
      clearInterval(t);
    };
  }, [user?.user_id]);'''

    if old_block in src:
        src = src.replace(old_block, new_block, 1)

    file.write_text(src)
    print(f"patched: {file}")
    print(f"backup : {backup}")
