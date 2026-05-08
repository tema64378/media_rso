use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub role: String,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Submission {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub url: Option<String>,
}
