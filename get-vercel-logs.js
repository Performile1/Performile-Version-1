const { exec } = require('child_process');

console.log('Fetching Vercel logs...');

// Run vercel logs command
exec('vercel logs performile-platform-yhep.vercel.app --limit 50', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error fetching logs: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  if (stdout) {
    console.log('Vercel Logs:');
    console.log(stdout);
  } else {
    console.log('No logs found. Make sure you are authenticated with Vercel CLI.');
  }
});
