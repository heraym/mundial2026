import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ces-messenger': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'deployment-id'?: string;
          'api-uri'?: string;
          'location-id'?: string;
          'project-id'?: string;
          'agent-id'?: string;
          'token-broker-url'?: string;
          'chat-title'?: string;
          'chat-title-icon'?: string;
          'initial-message'?: string;
          'user-id-token'?: string;
          'wait-for-auth'?: string;
          'auto-open-chat'?: string;
          'show-error-messages'?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ces-messenger': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'deployment-id'?: string;
          'api-uri'?: string;
          'location-id'?: string;
          'project-id'?: string;
          'agent-id'?: string;
          'token-broker-url'?: string;
          'chat-title'?: string;
          'chat-title-icon'?: string;
          'initial-message'?: string;
          'user-id-token'?: string;
          'wait-for-auth'?: string;
          'auto-open-chat'?: string;
          'show-error-messages'?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
