const { exec } = require('child_process');

console.log('=== Vercel Deployment Status ===');

// Check deployment status
exec('vercel ls performile-platform-yhep', (error, stdout, stderr) => {
  if (error) {
    console.error('Error checking deployment status:', error.message);
    return;
  }
  
  console.log('Deployment Status:');
  console.log(stdout || 'No deployment information found');
  
  // If we have a deployment ID, try to get logs
  const deploymentMatch = stdout && stdout.match(/https:\/\/vercel\.com\/[^/]+\/[^/]+\/([^\s]+)/);
  if (deploymentMatch && deploymentMatch[1]) {
    const deploymentId = deploymentMatch[1];
    console.log('\nFetching logs for deployment:', deploymentId);
    
    exec(`vercel logs ${deploymentId}`, (logError, logStdout, logStderr) => {
      if (logError) {
        console.error('Error fetching logs:', logError.message);
        return;
      }
      
      if (logStdout) {
        console.log('\nDeployment Logs:');
        console.log(logStdout);
      } else {
        console.log('No logs found for this deployment.');
      }
    });
  }
});
