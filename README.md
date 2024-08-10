# Installation

```bash
yarn install
```

## Develop
1. Deploy Agora Token Deployment https://docs.agora.io/en/signaling/get-started/authentication-workflow?platform=web#prerequisites
2. Rename the `.env.example` to `.env`. Fill the information:
   - VITE_AGORA_APP_ID: The App ID obtained from Agora Console
   - VITE_AGORA_TOKEN_SERVER_URL: The token server url obtained from step 1
   - VITE_AGORA_TOKEN: The agora token obtained from Agora Console
3. `yarn dev`.
