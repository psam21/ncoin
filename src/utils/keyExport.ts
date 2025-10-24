
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
═══════════════════════════════════════════════════════════════════════════
                        NOSTR KEY BACKUP - KEEP SECRET!
═══════════════════════════════════════════════════════════════════════════

⚠️  WARNING: Anyone with your private key can impersonate you!

PUBLIC KEY (npub) - Safe to share:
${npub}

PRIVATE KEY (nsec) - NEVER SHARE:
${nsec}

───────────────────────────────────────────────────────────────────────────

DO THIS NOW:
1. Store in password manager or encrypted drive
2. Make 2+ backups in different secure places
3. Import to browser extension: Alby (getalby.com) or nos2x

DON'T DO THIS:
❌ Share your nsec with anyone
❌ Post online or send via email/text
❌ Store in plain text on your computer

If lost, your account is gone forever. No recovery possible.

───────────────────────────────────────────────────────────────────────────
Generated: ${new Date().toISOString()}
Nostr Messenger: https://nostrcoin.vercel.app
═══════════════════════════════════════════════════════════════════════════
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
