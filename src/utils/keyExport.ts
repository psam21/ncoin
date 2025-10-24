
export function createBackupFile(
  displayName: string,
  npub: string,
  nsec: string
): void {
  // Format the backup file content
  const backupContent = formatBackupContent(npub, nsec);
  
  // Create safe filename (remove special characters)
  const safeDisplayName = displayName
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50); // Limit filename length
  
  const filename = `${safeDisplayName}_culturebridge.txt`;
  
  // Trigger download
  downloadTextFile(backupContent, filename);
  
}

function formatBackupContent(npub: string, nsec: string): string {
  return `
════════════════════════════════════════════════════════════════════════════════
                         CULTURE BRIDGE - NOSTR KEY BACKUP
════════════════════════════════════════════════════════════════════════════════

⚠️  CRITICAL SECURITY WARNING ⚠️

This file contains your Nostr private key (nsec). Anyone with access to this key
can impersonate you, post as you, and access your Nostr account.

🔒 SECURITY GUIDELINES:

1. Store this file in a SECURE location (password manager, encrypted drive)
2. NEVER share your nsec (private key) with anyone
3. NEVER post your nsec online or send it via email/messaging
4. Consider importing to a browser extension for better security
5. Make multiple backups in different secure locations
6. If you lose this file, you will PERMANENTLY lose access to your account

────────────────────────────────────────────────────────────────────────────────

YOUR NOSTR KEYS:

Public Key (npub):
${npub}

✅ Safe to share - This is your public identity on Nostr

────────────────────────────────────────────────────────────────────────────────

Private Key (nsec):
${nsec}

❌ NEVER SHARE - Keep this secret and secure

────────────────────────────────────────────────────────────────────────────────

NEXT STEPS:

1. Import this nsec into a Nostr browser extension (recommended):
   - nos2x: https://github.com/fiatjaf/nos2x
   - Alby: https://getalby.com
   - Flamingo: https://flamingo.me

2. After importing to extension, sign out of Culture Bridge

3. Sign in again using your browser extension (NIP-07)

4. Store it in a highly secure location

────────────────────────────────────────────────────────────────────────────────

CULTURE BRIDGE:
https://culturebridge.vercel.app

Preserving Culture and Heritage on Nostr 🌍✨

────────────────────────────────────────────────────────────────────────────────

Generated: ${new Date().toISOString()}

════════════════════════════════════════════════════════════════════════════════
`;
}

function downloadTextFile(content: string, filename: string): void {
  // Create blob with UTF-8 encoding
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // Create temporary download URL
  const url = URL.createObjectURL(blob);
  
  // Create temporary anchor element
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  
  // Trigger download
  document.body.appendChild(anchor);
  anchor.click();
  
  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function validateBackupContent(content: string): {
  isValid: boolean;
  hasNpub: boolean;
  hasNsec: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for npub
  const hasNpub = content.includes('npub1');
  if (!hasNpub) {
    errors.push('Missing public key (npub)');
  }
  
  // Check for nsec
  const hasNsec = content.includes('nsec1');
  if (!hasNsec) {
    errors.push('Missing private key (nsec)');
  }
  
  // Check for warnings
  if (!content.includes('SECURITY WARNING')) {
    errors.push('Missing security warnings');
  }
  
  return {
    isValid: hasNpub && hasNsec,
    hasNpub,
    hasNsec,
    errors,
  };
}
