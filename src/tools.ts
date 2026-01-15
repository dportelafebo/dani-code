import { tool } from "ai";
import { z } from "zod";

// Dangerous commands that should never be allowed
const DANGEROUS_COMMANDS = [
  // Privilege escalation
  "sudo",
  "su",
  "doas",
  // File deletion/modification
  "rm",
  "rmdir",
  "unlink",
  "shred",
  // File editing
  "mv",
  "cp",
  "dd",
  "truncate",
  // In-place editing
  "sed",
  "awk",
  "perl",
  "ed",
  "ex",
  // File creation/writing
  "touch",
  "mkdir",
  "mkfifo",
  "mknod",
  "tee",
  // Permission changes
  "chmod",
  "chown",
  "chgrp",
  "chattr",
  // Package management
  "apt",
  "apt-get",
  "yum",
  "dnf",
  "pacman",
  "brew",
  "npm",
  "pnpm",
  "yarn",
  "pip",
  "gem",
  "cargo",
  // System management
  "systemctl",
  "service",
  "init",
  "shutdown",
  "reboot",
  "poweroff",
  "halt",
  // Network modification
  "iptables",
  "ufw",
  "firewall-cmd",
  // User management
  "useradd",
  "userdel",
  "usermod",
  "passwd",
  "groupadd",
  "groupdel",
  // Disk operations
  "fdisk",
  "mkfs",
  "mount",
  "umount",
  "parted",
  // Process killing
  "kill",
  "killall",
  "pkill",
  // Git write operations
  "git push",
  "git commit",
  "git reset",
  "git checkout",
  "git merge",
  "git rebase",
  "git cherry-pick",
  "git revert",
  // Downloading/executing
  "curl",
  "wget",
  "exec",
  "eval",
  "source",
];

// Dangerous shell patterns
const DANGEROUS_PATTERNS = [
  /[|&;].*(?:rm|mv|dd|mkfs|shutdown|reboot)\b/, // piping to dangerous commands
  />/, // output redirection (overwrites files)
  />>/, // append redirection
  /\$\(.*\)/, // command substitution (could hide dangerous commands)
  /`.*`/, // backtick command substitution
  /\bxargs\b/, // xargs can execute arbitrary commands
  /:\s*>/, // truncate file pattern
  /\bchmod\b/, // permission changes
  /\bchown\b/, // ownership changes
];

function validateCommand(command: string): { safe: boolean; reason?: string } {
  const trimmedCommand = command.trim().toLowerCase();
  const words = trimmedCommand.split(/\s+/);
  const firstWord = words[0];

  // Check if command starts with a dangerous command
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (dangerous.includes(" ")) {
      // Multi-word dangerous command (like "git push")
      if (trimmedCommand.startsWith(dangerous)) {
        return { safe: false, reason: `Command '${dangerous}' is not allowed in read-only mode` };
      }
    } else {
      // Single word command
      if (firstWord === dangerous) {
        return { safe: false, reason: `Command '${dangerous}' is not allowed in read-only mode` };
      }
    }
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return { safe: false, reason: `Command contains dangerous pattern: ${pattern.toString()}` };
    }
  }

  return { safe: true };
}

export const runBash = tool({
  description: `Run a read-only bash command for exploration and information gathering. 
    This tool is restricted to safe, non-destructive operations like:
    - Listing files (ls, find, tree)
    - Reading files (cat, head, tail, less, bat)
    - Searching (grep, rg, ag, fd)
    - System info (uname, whoami, hostname, df, du, ps, top, htop)
    - Environment (env, printenv, echo)
    - Git read operations (git status, git log, git diff, git branch)
    - File inspection (file, stat, wc)

NOT allowed: file modification, deletion, permission changes, package management, or any sudo commands.`,
  inputSchema: z.object({
    command: z.string().describe("The bash command to execute (read-only operations only)"),
    workingDirectory: z.string().optional().describe("Optional working directory for the command"),
  }),
  execute: async ({command, workingDirectory}) => {
    // Validate the command is safe
    const validation = validateCommand(command);
    if (!validation.safe) {
      throw new Error(`Unsafe command blocked: ${validation.reason}`);
    }

    try {
      const proc = Bun.spawn(["bash", "-c", command], {
        cwd: workingDirectory,
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return {
          success: false,
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        };
      }

      return {
        success: true,
        exitCode: 0,
        stdout: stdout.trim(),
        stderr: stderr.trim() || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to execute command: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Export all tools as an object for easy use
export const tools = {
  runBash,
};
