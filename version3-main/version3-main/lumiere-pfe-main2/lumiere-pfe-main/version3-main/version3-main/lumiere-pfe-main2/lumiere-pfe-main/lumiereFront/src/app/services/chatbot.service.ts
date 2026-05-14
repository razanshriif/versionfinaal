import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly API_URL = `${environment.v1ApiUrl}/chatbot`;
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private typingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.typingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.addWelcomeMessage();
  }

  sendMessage(message: string): Observable<any> {
    const userMessage: ChatMessage = {
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    this.addMessage(userMessage);
    this.typingSubject.next(true);
    
    return this.http.post<any>(`${this.API_URL}/message`, { 
      message,
      platform: 'web'
    }, { headers: this.getAuthHeaders() });
  }

  addMessage(message: ChatMessage) {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      content: 'Bonjour ! Je suis votre assistant virtuel OTFLOW Transport. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
    this.addMessage(welcomeMessage);
  }

  async clearHistory(): Promise<void> {
    this.messagesSubject.next([]);
    this.addWelcomeMessage();
    return Promise.resolve();
  }

  setTyping(isTyping: boolean) {
    this.typingSubject.next(isTyping);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});
  }
}




