import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../services/chatbot.service';

interface Message {
  text: string;
  isUser: boolean;
  time: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements AfterViewChecked, OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isChatOpen = false;
  userInput = '';
  messages: Message[] = [];
  isTyping = false;
  hasNewMessages = false;
  unreadCount = 0;
  showQuickReplies = true;

  quickReplies = [
    '📦 Suivre une commande',
    '📋 Créer un ordre',
    '👤 Gestion clients',
    '❓ Aide'
  ];

  constructor(private chatbotService: ChatbotService) {
    this.clearChat();
  }

  clearChat() {
    this.chatbotService.clearHistory().then(() => {
      this.messages = [];
      this.showQuickReplies = true;
    });
  }

  ngOnInit() {
    // Initialiser avec les messages du service
    this.chatbotService.messages$.subscribe(msgs => {
      this.messages = msgs.map(m => ({
        text: m.content,
        isUser: m.sender === 'user',
        time: this.formatTime(m.timestamp)
      }));
    });

    this.chatbotService.isTyping$.subscribe(typing => {
      this.isTyping = typing;
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.hasNewMessages = false;
      this.unreadCount = 0;
    }
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.showQuickReplies = false;

    this.chatbotService.sendMessage(userMessage).subscribe({
      next: (response) => {
        this.chatbotService.setTyping(false);
        this.chatbotService.addMessage({
          content: response.response,
          sender: 'bot',
          timestamp: new Date()
        });
        
        if (!this.isChatOpen) {
          this.hasNewMessages = true;
          this.unreadCount++;
        }
      },
      error: (err) => {
        this.chatbotService.setTyping(false);
        this.chatbotService.addMessage({
          content: "Désolé, une erreur est survenue lors de la communication avec l'assistant.",
          sender: 'bot',
          timestamp: new Date()
        });
      }
    });
  }

  sendQuickReply(reply: string) {
    this.userInput = reply;
    this.sendMessage();
  }

  public formatMessage(text: string): string {
    if (!text) return '';
    // Escape HTML
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Convert lines starting with '- ' into styled bullet items
    formatted = formatted.replace(/^- (.+)$/gm, '<span class="bullet-item">&bull; $1</span>');
    // Convert remaining newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore scroll errors during transitions
    }
  }
}




