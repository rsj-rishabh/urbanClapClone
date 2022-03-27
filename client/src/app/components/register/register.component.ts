import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';
import * as $ from 'jquery';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  registerForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    gender : new FormControl(''),
    username: new FormControl(''),
    password : new FormControl(''),
  });

  pword = true;
  cpword = true;

  onSubmit() {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    }
    this.http.post<any>('http://localhost:3000/api/user',this.registerForm.value,{headers})
    .subscribe(response => {
      console.log(response)
       alert("Registration success");
    },
    err => {
      //alert("user exists already");
    }
    )
    console.warn(this.registerForm.value);
  }
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    
  }

  changeStatus(elementId:String){
    if(elementId === 'pword'){
      if(this.pword){
        this.pword = false;
        $('#'+elementId).prop('type','text');
      }else{
        this.pword = true;
        $('#'+elementId).prop('type','password');
      }
    } else if (elementId === 'cpword'){
      if(this.cpword){
        this.cpword = false;
        $('#'+elementId).prop('type','text');
      }else{
        this.cpword = true;
        $('#'+elementId).prop('type','password');
      }
    }
  }

  highlight(elementId:String){
    $('#'+elementId).css({'color': 'whitesmoke','background': '#1e2833','font-size': '13px','opacity': '0.9'});
  }

  playdown(elementId:String){
    $('#'+elementId).css({'color': 'whitesmoke','background': '#1e2833','font-size': '13px','opacity': '0.5'});
  }


}
