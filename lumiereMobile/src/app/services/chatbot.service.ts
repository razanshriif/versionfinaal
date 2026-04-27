// src/app/services/chatbot.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id?: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'card' | 'list';
  data?: any;
}

export interface QuickReply {
  label: string;
  action: string;
  payload?: any;
}

export interface ChatSession {
  id: string;
  userId: number;
  startTime: Date;
  lastActivity: Date;
  messages: ChatMessage[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly API_URL = `${environment.apiUrl}/v1/chatbot`;
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private typingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.typingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.clearHistory();
  }

  /**
   * Envoyer un message
   */
  sendMessage(message: string): Observable<ChatMessage> {
    // Ajouter le message de l'utilisateur
    const userMessage: ChatMessage = {
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    this.addMessage(userMessage);
    this.typingSubject.next(true);

    // Prepare history (last 10 messages)
    const history = this.messagesSubject.value.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // Envoyer au backend
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/message`, { 
        message,
        history,
        platform: 'mobile'
      }).subscribe(
        response => {
          this.typingSubject.next(false);
          
          const botMessage: ChatMessage = {
            content: response.response,
            sender: 'bot',
            timestamp: new Date(),
            type: response.type || 'text',
            data: response.data
          };
          
          this.addMessage(botMessage);
          observer.next(botMessage);
          observer.complete();
        },
        error => {
          this.typingSubject.next(false);
          observer.error(error);
        }
      );
    });
  }

  /**
   * Envoyer une action (quick reply, etc.)
   */
  sendAction(action: string, payload?: any): Observable<ChatMessage> {
    this.typingSubject.next(true);
    
    return new Observable(observer => {
      this.http.post<any>(`${this.API_URL}/action`, { action, payload }).subscribe(
        response => {
          this.typingSubject.next(false);
          
          const botMessage: ChatMessage = {
            content: response.response,
            sender: 'bot',
            timestamp: new Date(),
            type: response.type || 'text',
            data: response.data
          };
          
          this.addMessage(botMessage);
          observer.next(botMessage);
          observer.complete();
        },
        error => {
          this.typingSubject.next(false);
          observer.error(error);
        }
      );
    });
  }

  /**
   * Obtenir les questions fréquentes
   */
  getFAQ(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/faq`);
  }

  /**
   * Obtenir les suggestions de réponses rapides
   */
  getQuickReplies(): Observable<QuickReply[]> {
    return this.http.get<QuickReply[]>(`${this.API_URL}/quick-replies`);
  }

  /**
   * Obtenir le statut d'une commande via le chatbot
   */
  getOrderStatus(orderNumber: string): Observable<any> {
    return this.http.get(`${this.API_URL}/order-status/${orderNumber}`);
  }

  /**
   * Démarrer une nouvelle conversation
   */
  startNewConversation(): void {
    this.messagesSubject.next([]);
    this.addWelcomeMessage();
  }

  /**
   * Ajouter un message à la conversation
   */
  private addMessage(message: ChatMessage) {
    // Utilisation d'un nouvel array pour déclencher les abonnés RxJS
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
    this.saveChatHistory();
  }

  /**
   * Ajouter le message de bienvenue
   */
  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      content: 'Bonjour ! Je suis votre assistant virtuel OTFLOW Transport. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
    
    this.addMessage(welcomeMessage);
  }

  /**
   * Charger l'historique de chat depuis le stockage local
   */
  private async loadChatHistory() {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: 'chat_history' });
      
      if (value) {
        const messages = JSON.parse(value);
        this.messagesSubject.next(messages);
      } else {
        this.addWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.addWelcomeMessage();
    }
  }

  /**
   * Sauvegarder l'historique de chat
   */
  private async saveChatHistory() {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const messages = this.messagesSubject.value;
      
      await Preferences.set({
        key: 'chat_history',
        value: JSON.stringify(messages)
      });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Effacer l'historique de chat
   */
  async clearHistory() {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key: 'chat_history' });
      this.startNewConversation();
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }

  /**
   * Évaluer une réponse du chatbot
   */
  rateResponse(messageId: number, rating: 'positive' | 'negative'): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/rate`, { messageId, rating });
  }
}

