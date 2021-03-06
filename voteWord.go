package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type VoteWordInfo struct {
	Id         int    `json:"id"`
	Word       string `json:"word"`
	Empathy    int    `json:"empathy"`
	UserCookie string `json:"user_cookie,omitempty"`
}

func getVoteWordInfo(w http.ResponseWriter, r *http.Request) {
	row, err := Db.Query("select * from vote_word_info_" + TABLE_NAME)
	if err != nil {
		fmt.Println("エラー:", err)
	}

	var voteWords []VoteWordInfo
	for row.Next() {
		voteWord := VoteWordInfo{}
		err = row.Scan(
			&voteWord.Id,
			&voteWord.Word,
			&voteWord.Empathy,
			&voteWord.UserCookie,
		)
		if err != nil {
			fmt.Println("エラー:", err)
		}
		voteWords = append(voteWords, voteWord)
	}

	result, err := json.Marshal(voteWords)
	if err != nil {
		fmt.Println("エラー:", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(result)
}

func getWordEmpathyInfo(w http.ResponseWriter, r *http.Request) {
	row, err := Db.Query("select ifnull(max(id),0) from vote_word_info_" + TABLE_NAME)
	if err != nil {
		fmt.Println("エラー:", err.Error())
	}
	var maxId int
	for row.Next() {
		row.Scan(&maxId)
	}

	cookie, err := r.Cookie("user-id")
	if err != nil {
		fmt.Println("エラー: ", err)
	}

	row, err = Db.Query("select word_id from user_voted_word_"+TABLE_NAME+" where user_cookie=?", cookie.Value)
	if err != nil {
		fmt.Println("エラー:", err.Error())
	}
	defer row.Close()

	wordEmpathy := make([]int, maxId+1)
	for row.Next() {
		var stickyId int
		err = row.Scan(&stickyId)
		if err != nil {
			fmt.Println("エラー", err)
		}
		wordEmpathy[stickyId] = 1
	}

	result, err := json.Marshal(wordEmpathy)
	if err != nil {
		fmt.Println("エラー:", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(result)
}

func voteWord(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("user-id")
	if err != nil {
		fmt.Println("エラー: ", err)
	}

	type VoteWord struct {
		Word string `json:"word"`
	}
	var voteWord VoteWord
	len := r.ContentLength
	body := make([]byte, len)
	r.Body.Read(body)
	if err := json.Unmarshal(body[:len], &voteWord); err != nil {
		fmt.Println("エラー:", err)
	}

	sql, err := Db.Prepare("insert into vote_word_info_" + TABLE_NAME + "(word, user_cookie) values(?, ?)")
	if err != nil {
		fmt.Println(err)
	}
	sql.Exec(voteWord.Word, cookie.Value)

	row, err := Db.Query("select ifnull(max(id),0) from vote_word_info_" + TABLE_NAME)
	if err != nil {
		fmt.Println("エラー:", err.Error())
	}
	defer row.Close()

	var id int
	for row.Next() {
		if er := row.Scan(&id); er != nil {
			fmt.Println("エラー:", er)
		}
	}

	res, err := json.Marshal(id)
	if err != nil {
		fmt.Println("エラー:", err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func incrementWordEmpathy(w http.ResponseWriter, r *http.Request) {
	type TargetId struct {
		Id int `json:"id"`
	}
	var targetId TargetId
	len := r.ContentLength
	body := make([]byte, len)
	r.Body.Read(body)
	if err := json.Unmarshal(body[:len], &targetId); err != nil {
		fmt.Println("エラー:", err)
	}

	sql, err := Db.Prepare("update vote_word_info_" + TABLE_NAME + " set empathy=empathy+1 where id=?")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id)

	cookie, err := r.Cookie("user-id")
	if err != nil {
		fmt.Println("エラー: ", err)
	}
	sql, err = Db.Prepare("insert into user_voted_word_" + TABLE_NAME + "(word_id, user_cookie) values(?, ?)")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id, cookie.Value)

	res, err := json.Marshal("{200, \"ok\"}")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func decrementWordEmpathy(w http.ResponseWriter, r *http.Request) {
	type TargetId struct {
		Id int `json:"id"`
	}
	var targetId TargetId
	len := r.ContentLength
	body := make([]byte, len)
	r.Body.Read(body)
	if err := json.Unmarshal(body[:len], &targetId); err != nil {
		fmt.Println("エラー:", err)
	}

	sql, err := Db.Prepare("update vote_word_info_" + TABLE_NAME + " set empathy=empathy-1 where id=?")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id)

	cookie, err := r.Cookie("user-id")
	if err != nil {
		fmt.Println("エラー: ", err)
	}
	sql, err = Db.Prepare("delete from user_voted_word_" + TABLE_NAME + " where word_id=? and user_cookie=?")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id, cookie.Value)

	res, err := json.Marshal("{200, \"ok\"}")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func removeVoteWord(w http.ResponseWriter, r *http.Request) {
	type TargetId struct {
		Id int `json:"id"`
	}
	var targetId TargetId
	len := r.ContentLength
	body := make([]byte, len)
	r.Body.Read(body)
	if err := json.Unmarshal(body[:len], &targetId); err != nil {
		fmt.Println("エラー:", err)
	}

	sql, err := Db.Prepare("delete from vote_word_info_" + TABLE_NAME + " where id=?")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id)

	sql, err = Db.Prepare("delete from user_voted_word_" + TABLE_NAME + " where word_id=?")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	sql.Exec(targetId.Id)

	res, err := json.Marshal("{200, \"ok\"}")
	if err != nil {
		fmt.Println("エラー:", err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}
