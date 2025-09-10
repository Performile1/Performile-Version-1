const { exec } = require('child_process');

console.log('Fetching Vercel logs for performile-platform-yhep.vercel.app...');

// Try to get logs using Vercel CLI
exec('vercel logs performile-platform-yhep.vercel.app --limit 50', (error, stdout, stderr) => {
  if (error) {
    console.error('Error fetching logs with Vercel CLI:', error.message);
    console.log('Make sure you are authenticated with Vercel CLI and have access to the project.');
    return;
  }
  
  if (stderr) {
    console.error('Error:', stderr);
    return;
  }
  
  if (stdout) {
    console.log('Vercel Logs:');
    console.log(stdout);
  } else {
    console.log('No logs found.');
  }
});
