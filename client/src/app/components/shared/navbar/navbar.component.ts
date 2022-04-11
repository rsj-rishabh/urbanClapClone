import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {

  isLoggedIn:boolean = false;
  currentRoute:string = '';

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.ngOnInit();
    this.router.navigate(['/']);
  }

  constructor(private http: HttpClient,public router:Router) {  
   }


  ngOnInit(): void {
    if (localStorage.getItem('isLoggedIn') == 'true') {
      this.isLoggedIn = true;
    }
    else {
      this.isLoggedIn = false;
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.currentRoute = event.url;
      }
    });

    // this.currentRoute = this.router.url;
    // console.log('Hi');
    // console.log(this.currentRoute);
  }

}
