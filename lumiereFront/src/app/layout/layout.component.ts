import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    ChatbotComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  showDashboard = false;

  isSidebarOpen = true;
  router: any;
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }


  subMenuVisible: boolean = false;
  isActive: boolean = false;

  toggleSubMenu(): void {
    this.subMenuVisible = !this.subMenuVisible;
    this.isActive = !this.isActive;
  }

  login() {


    this.router.navigate(["/client/"])


  }
}



