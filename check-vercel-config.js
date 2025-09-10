const { exec } = require('child_process');

console.log('Checking Vercel project configuration...');

// Check if Vercel CLI is authenticated
exec('vercel whoami', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Vercel CLI not authenticated. Please run: vercel login');
    return;
  }
  
  console.log(`✅ Logged in to Vercel as: ${stdout.trim()}`);
  
  // Check project information
  console.log('\nFetching project information...');
  exec('vercel project ls', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error fetching project information:', error.message);
      return;
    }
    
    console.log('\nVercel Projects:');
    console.log(stdout);
    
    // Check environment variables
    console.log('\nFetching environment variables...');
    exec('vercel env ls', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error fetching environment variables:', error.message);
        return;
      }
      
      console.log('\nEnvironment Variables:');
      console.log(stdout || 'No environment variables found');
      
      // Check deployment status
      console.log('\nChecking deployment status...');
      exec('vercel ls performile-platform-yhep', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error fetching deployment status:', error.message);
          return;
        }
        
        console.log('\nDeployment Status:');
        console.log(stdout || 'No deployment information found');
      });
    });
  });
});
