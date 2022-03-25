import { Component, OnInit } from '@angular/core';
import { GlobalConstants } from 'src/app/common/global-constants';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  isLoggedIn = localStorage.getItem('isLoggedIn');

  constructor() { }

  ngOnInit(): void {
  }

}
