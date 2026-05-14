import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-loading-splash',
    templateUrl: './loading-splash.component.html',
    styleUrls: ['./loading-splash.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class LoadingSplashComponent implements OnInit {
    isVisible = true;

    constructor(private loadingService: LoadingService) { }

    ngOnInit() {
        this.loadingService.loading$.subscribe(loading => {
            this.isVisible = loading;
        });
    }
}

