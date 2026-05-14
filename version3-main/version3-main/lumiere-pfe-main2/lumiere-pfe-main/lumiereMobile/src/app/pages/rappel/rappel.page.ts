import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonHeader, IonButtons,
    IonIcon, IonFab, IonFabButton, IonModal, IonDatetime, IonButton,
    AlertController, IonTitle, IonToolbar, IonCheckbox,
    IonSegment, IonSegmentButton, IonLabel, IonFooter, IonSpinner
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
    addOutline, alarmOutline, trashOutline, checkmarkCircle, createOutline,
    arrowBackOutline, calendarOutline, notificationsOutline, informationCircleOutline,
    optionsOutline, timeOutline, logOutOutline, checkboxOutline, checkbox,
    sparklesOutline, personOutline, chevronForwardOutline, documentTextOutline,
    chevronBackOutline, chevronUpOutline, chevronDownOutline, closeOutline,
    listOutline, infiniteOutline, calendarClearOutline, flashOutline, hourglassOutline
} from 'ionicons/icons';

export interface Rappel {
    id: string;
    titre: string;
    note?: string;
    date: string; // ISO string
    fait: boolean;
    source?: 'manual' | 'ia';
}

export interface RappelGroup {
    label: string;
    items: Rappel[];
}

@Component({
    selector: 'app-rappel',
    templateUrl: './rappel.page.html',
    styleUrls: ['./rappel.page.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IonContent, IonHeader, IonButtons, IonTitle,
        IonIcon, IonFab, IonFabButton, IonModal, IonDatetime, IonButton,
        IonToolbar, IonCheckbox, IonSegment, IonSegmentButton, IonLabel,
        IonFooter, IonSpinner
    ]
})
export class RappelPage implements OnInit {
    rappels: Rappel[] = [];
    groupedRappels: RappelGroup[] = [];
    isModalOpen = false;
    editingRappel: Rappel | null = null;
    newRappel: Partial<Rappel> = {
        titre: '',
        note: '',
        date: ''
    };
    selectedSegment: 'manual' | 'ia' = 'manual';

    // ── Custom Calendar State ──
    viewDate: Date = new Date();
    calendarDays: any[] = [];
    selDate: { y: number, m: number, d: number } = { y: 0, m: 0, d: 0 };
    selHour: number = 9;
    selMin: number = 0;
    weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    constructor(
        private alertCtrl: AlertController,
        public navCtrl: NavController
    ) {
        addIcons({
            addOutline, alarmOutline, trashOutline, checkmarkCircle, createOutline,
            arrowBackOutline, calendarOutline, notificationsOutline, informationCircleOutline,
            optionsOutline, timeOutline, logOutOutline, checkboxOutline, checkbox,
            sparklesOutline, personOutline, chevronForwardOutline, documentTextOutline,
            chevronBackOutline, chevronUpOutline, chevronDownOutline, closeOutline,
            listOutline, infiniteOutline, calendarClearOutline, flashOutline, hourglassOutline
        });
    }

    logout() {
        this.navCtrl.navigateRoot('/login');
    }

    ngOnInit() {
        this.load();
    }

    ionViewWillEnter() {
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem('rappels');
            this.rappels = raw ? JSON.parse(raw) : [];

            if (!Array.isArray(this.rappels)) {
                this.rappels = [];
            }

            this.rappels.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
            });

            this.updateGrouping();
        } catch (e) {
            console.error('Error loading rappels:', e);
            this.rappels = [];
            this.groupedRappels = [];
        }
    }

    updateGrouping() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const groupsMap: { [key: string]: Rappel[] } = {
            "Aujourd'hui": [],
            "Demain": [],
            "Plus tard": []
        };

        const filtered = this.rappels.filter(r => {
            const isIA = r.source === 'ia' || (r.note && r.note.includes('IA'));
            return this.selectedSegment === 'ia' ? isIA : !isIA;
        });

        filtered.forEach(r => {
            if (!r.date) return;
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);

            if (d.getTime() === today.getTime()) {
                groupsMap["Aujourd'hui"].push(r);
            } else if (d.getTime() === tomorrow.getTime()) {
                groupsMap["Demain"].push(r);
            } else {
                groupsMap["Plus tard"].push(r);
            }
        });

        this.groupedRappels = Object.keys(groupsMap)
            .map(label => ({ label, items: groupsMap[label] }))
            .filter(g => g.items.length > 0);
    }

    save() {
        localStorage.setItem('rappels', JSON.stringify(this.rappels));
        this.updateGrouping();
    }

    openModal(r?: Rappel) {
        if (r) {
            this.editingRappel = r;
            this.newRappel = { ...r };
            const d = new Date(r.date);
            this.selDate = { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
            this.selHour = d.getHours();
            this.selMin = d.getMinutes();
            this.viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
        } else {
            this.editingRappel = null;
            const now = new Date();
            this.selDate = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
            this.selHour = now.getHours();
            this.selMin = now.getMinutes();
            this.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
            this.newRappel = {
                titre: '',
                note: '',
                date: now.toISOString()
            };
        }
        this.generateCalendar();
        this.isModalOpen = true;
    }

    // ── Custom Calendar Logic ──
    generateCalendar() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Prepend empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null });
        }
        // Actual days
        const today = new Date();
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                isToday: i === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
                isSelected: i === this.selDate.d && month === this.selDate.m && year === this.selDate.y
            });
        }
        this.calendarDays = days;
        this.updateISODate();
    }

    changeMonth(delta: number) {
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + delta, 1);
        this.generateCalendar();
    }

    selectDay(dayNum: number | null) {
        if (!dayNum) return;
        this.selDate = { y: this.viewDate.getFullYear(), m: this.viewDate.getMonth(), d: dayNum };
        this.generateCalendar();
    }

    adjustTime(type: 'h' | 'm', delta: number) {
        if (type === 'h') {
            this.selHour = (this.selHour + delta + 24) % 24;
        } else {
            this.selMin = (this.selMin + delta + 60) % 60;
        }
        this.updateISODate();
    }

    updateISODate() {
        const d = new Date(this.selDate.y, this.selDate.m, this.selDate.d, this.selHour, this.selMin);
        this.newRappel.date = d.toISOString();
    }

    getFormattedSelectedDate(): string {
        const d = new Date(this.selDate.y, this.selDate.m, this.selDate.d);
        const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()];
        return `${dayName} ${this.selDate.d} ${this.monthNames[this.selDate.m]}`;
    }

    pad(n: number) {
        return n.toString().padStart(2, '0');
    }

    closeModal() {
        this.isModalOpen = false;
    }

    saveRappel() {
        if (!this.newRappel.titre?.trim()) return;

        if (this.editingRappel) {
            const idx = this.rappels.findIndex(x => x.id === this.editingRappel!.id);
            if (idx > -1) {
                this.rappels[idx] = { ...this.editingRappel, ...this.newRappel, fait: this.editingRappel.fait } as Rappel;
            }
        } else {
            const r: Rappel = {
                id: Date.now().toString(),
                titre: this.newRappel.titre!.trim(),
                note: this.newRappel.note?.trim() || undefined,
                date: this.newRappel.date || new Date().toISOString(),
                fait: false,
                source: 'manual'
            };
            this.rappels.push(r);
        }

        this.save();
        this.closeModal();
    }

    segmentChanged(ev: any) {
        this.selectedSegment = ev.detail.value;
        this.updateGrouping();
    }

    async deleteRappel(r: Rappel, event?: Event) {
        if (event) event.stopPropagation();
        const alert = await this.alertCtrl.create({
            header: 'Supprimer',
            message: `Supprimer « ${r.titre} » ?`,
            buttons: [
                { text: 'Annuler', role: 'cancel' },
                {
                    text: 'Supprimer', role: 'destructive',
                    handler: () => {
                        this.rappels = this.rappels.filter(x => x.id !== r.id);
                        this.save();
                    }
                }
            ]
        });
        await alert.present();
    }

    toggleFait(r: Rappel, event?: Event) {
        if (event) event.stopPropagation();
        r.fait = !r.fait;
        this.save();
    }

    formatTime(iso: string): string {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit'
            }).replace(':', 'h');
        } catch (e) {
            return '';
        }
    }

    formatDate(iso: string): string {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch (e) {
            return '';
        }
    }
}

