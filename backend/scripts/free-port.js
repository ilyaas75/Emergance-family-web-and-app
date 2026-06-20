const { execFileSync } = require('child_process');

const port = process.env.PORT || process.argv[2] || '5000';

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

try {
  if (process.platform === 'win32') {
    const script = [
      '$ErrorActionPreference = "SilentlyContinue"',
      `$connections = @(Get-NetTCPConnection -LocalPort ${port} -State Listen)`,
      '$ownerIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)',
      'foreach ($ownerId in $ownerIds) {',
      '  if ($ownerId -and $ownerId -ne $PID) {',
      '    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerId" -ErrorAction SilentlyContinue',
      '    if ($proc -and $proc.ParentProcessId) {',
      '      $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.ParentProcessId)" -ErrorAction SilentlyContinue',
      '      if ($parent -and $parent.CommandLine -match "nodemon|badbaado-backend|src\\\\server.js") {',
      '        Stop-Process -Id $parent.ProcessId -Force -ErrorAction SilentlyContinue',
      '        Write-Output "Stopped watcher process $($parent.ProcessId)"',
      '      }',
      '    }',
      '    Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue',
      '    Write-Output "Stopped process $ownerId on port ' + port + '"',
      '  }',
      '}',
    ].join('; ');
    const output = run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
    if (output) console.log(output);
    else console.log(`Port ${port} is free`);
  } else {
    const pids = run('sh', ['-c', `lsof -ti tcp:${port} || true`]).split(/\s+/).filter(Boolean);
    if (!pids.length) console.log(`Port ${port} is free`);
    for (const pid of pids) {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`Stopped process ${pid} on port ${port}`);
    }
  }
} catch (err) {
  console.warn(`Could not free port ${port}: ${err.message}`);
}
