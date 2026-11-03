class User {
  constructor({ id, name, email, class_name = "" }) {
    this.id=id; this.name=name; this.email=email; this.className=class_name;
  }
  toPublicJSON() { return { id:this.id, name:this.name, email:this.email, className:this.className }; }
}
module.exports = User;
