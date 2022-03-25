import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {

  isLoggedIn = localStorage.getItem('isLoggedIn');

  logout() {
    localStorage.setItem('isLoggedIn', 'false');
    this.router.navigate(['/']);
  }

  constructor(private http: HttpClient,public router:Router) { }


  ngOnInit(): void {
    this.isLoggedIn = localStorage.getItem('isLoggedIn');
  }

}
