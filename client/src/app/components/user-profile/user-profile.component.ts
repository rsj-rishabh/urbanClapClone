import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalConstants } from 'src/app/common/global-constants';
import { Router } from '@angular/router';

@Component({
  selector: 'app-services',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})

export class UserProfileComponent implements OnInit {

    constructor(private http: HttpClient, private router: Router) { }

    userInfo = {
        name: localStorage.getItem('name'),
        username: localStorage.getItem('username'),
        email: localStorage.getItem('email'),
        gender: localStorage.getItem('gender')
    }

    ngOnInit(): void { 
        console.log(this.userInfo)
    }
}